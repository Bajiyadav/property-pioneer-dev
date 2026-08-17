import { createFileRoute, Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { PrivacyControls } from "@/modules/legal/components/PrivacyControls";
import {
  User,
  Mail,
  Phone,
  Shield,
  Edit3,
  Check,
  LogOut,
  Building2,
  Heart,
  Calendar,
  Loader2,
} from "lucide-react";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/profile")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/profile");
    const ogImage = getOgImageUrl();
    const title = `My Profile — ${APP_NAME}`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Manage your ${APP_NAME} profile, saved searches, and account settings.`,
        },
        { property: "og:title", content: title },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "robots", content: "noindex" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: ProfilePage,
});

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [savingName, setSavingName] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuthSession();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        setProfile({
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
          avatarUrl: user.user_metadata?.avatar_url || null,
          role: user.user_metadata?.role || "customer",
          createdAt: user.created_at,
        });
        setSavingName(user.user_metadata?.full_name || "");
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!savingName.trim()) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: savingName.trim() } });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      setProfile((p) => (p ? { ...p, name: savingName.trim() } : p));
      setEditing(false);
      toast.success("Name updated successfully!");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate({ to: "/auth", replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Sign in to view your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your saved properties, enquiries, and account details.
          </p>
        </div>
        <Link
          to="/auth"
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow hover:brightness-110 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const roleLabels: Record<string, string> = {
    customer: "Property Seeker",
    owner: "Property Owner",
    agent: "Real Estate Agent",
    admin: "Platform Admin",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Banner */}
      <div className="relative h-36 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />

      <div className="mx-auto max-w-3xl px-6 pb-16">
        {/* Profile card */}
        <div className="-mt-16 relative">
          <div className="rounded-3xl border border-border/60 bg-card shadow-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-primary/20 bg-primary/10 text-2xl font-black text-primary shadow">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    profile.name[0].toUpperCase()
                  )}
                </div>
                <div>
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={savingName}
                        onChange={(e) => setSavingName(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
                        aria-label="Save name"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-extrabold text-foreground">{profile.name}</h1>
                      <button
                        onClick={() => setEditing(true)}
                        aria-label="Edit name"
                        className="text-muted-foreground hover:text-foreground transition"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                    <Shield className="h-3 w-3" /> {roleLabels[profile.role] || profile.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>

            {/* Details */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 border-t border-border/60 pt-5">
              <DetailRow icon={Mail} label="Email" value={profile.email} />
              {profile.phone && <DetailRow icon={Phone} label="Phone" value={profile.phone} />}
              <DetailRow icon={Calendar} label="Member Since" value={joinDate} />
              <DetailRow icon={Shield} label="Account Status" value="Verified ✓" />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <ProfileQuickLink
            to="/favorites"
            icon={Heart}
            label="Saved Properties"
            desc="View your saved homes"
            color="text-rose-500 bg-rose-500/10"
          />
          <ProfileQuickLink
            to="/properties"
            search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
            icon={Building2}
            label="Browse Properties"
            desc="Explore new listings"
            color="text-blue-500 bg-blue-500/10"
          />
          <ProfileQuickLink
            to="/notifications"
            icon={Calendar}
            label="Notifications"
            desc="Visit alerts & updates"
            color="text-emerald-500 bg-emerald-500/10"
          />
        </div>

        {/* Data-subject rights the Privacy Policy links here for. */}
        <div className="mt-6">
          <PrivacyControls />
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 px-4 py-3">
      <Icon className="h-4 w-4 text-muted-foreground flex-none" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-xs font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ProfileQuickLink({
  to,
  search,
  icon: Icon,
  label,
  desc,
  color,
}: {
  to: LinkProps["to"];
  search?: LinkProps["search"];
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      search={search}
      className="rounded-2xl border border-border/60 bg-card p-4 hover:border-border transition group"
    >
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-2 text-xs font-extrabold text-foreground group-hover:text-primary transition">
        {label}
      </h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>
    </Link>
  );
}
