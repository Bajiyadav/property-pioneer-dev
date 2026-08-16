import {
  useAuth,
  type AuthStatus,
  type AuthContextType,
} from "@/modules/authentication/context/AuthContext";
import { type ResolvedSession } from "@/modules/authentication/services/session";

export type { AuthStatus };

export interface UseAuthSession extends ResolvedSession {
  status: AuthStatus;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * Single source of truth for "who is signed in and what may they see".
 *
 * Backed by the centralized AuthProvider so state changes (login, logout, role resolution)
 * synchronize immediately across the entire component tree.
 */
export function useAuthSession(): UseAuthSession {
  return useAuth();
}
