import { STORAGE_KEYS } from "@/config/storage";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

function migrateFavorites(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = window.localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!existing) {
      const legacy = window.localStorage.getItem(STORAGE_KEYS.LEGACY_FAVORITES);
      if (legacy) {
        window.localStorage.setItem(STORAGE_KEYS.FAVORITES, legacy);
        const verify = window.localStorage.getItem(STORAGE_KEYS.FAVORITES);
        if (verify === legacy) {
          window.localStorage.removeItem(STORAGE_KEYS.LEGACY_FAVORITES);
        }
      }
    }
  } catch {
    // Ignore storage quota or access errors gracefully
  }
}

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    migrateFavorites();
    const raw = window.localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Initialize from local storage & listen for auth state
  useEffect(() => {
    setIds(readLocal());

    // Check current auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUid = session?.user?.id ?? null;
      setUserId(currentUid);
      if (currentUid) {
        syncServerFavorites(currentUid);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUid = session?.user?.id ?? null;
      setUserId(currentUid);
      if (currentUid) {
        syncServerFavorites(currentUid);
      }
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.FAVORITES || e.key === STORAGE_KEYS.LEGACY_FAVORITES) {
        setIds(readLocal());
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Fetch server favorites for authenticated user
  const syncServerFavorites = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("property_id")
        .eq("user_id", uid);

      if (!error && data) {
        const serverIds = data.map((row: { property_id: string }) => row.property_id);
        const merged = Array.from(new Set([...readLocal(), ...serverIds]));
        setIds(merged);
        writeLocal(merged);
      }
    } catch {
      // Fallback to local storage if network or table unavailable
    }
  };

  const toggle = useCallback(
    async (propertyId: string) => {
      const isFav = ids.includes(propertyId);
      const next = isFav ? ids.filter((x) => x !== propertyId) : [...ids, propertyId];

      setIds(next);
      writeLocal(next);

      if (userId) {
        try {
          if (isFav) {
            await supabase
              .from("favorites")
              .delete()
              .eq("user_id", userId)
              .eq("property_id", propertyId);
          } else {
            await supabase.from("favorites").insert({ user_id: userId, property_id: propertyId });
          }
        } catch {
          // Local state remains consistent even if database update fails
        }
      }
    },
    [ids, userId],
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, has, toggle };
}
