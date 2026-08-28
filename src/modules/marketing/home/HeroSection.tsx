import { Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  Building2,
  Home,
  Building,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { TabbedSearchBox } from "./TabbedSearchBox";
import heroImg from "@/assets/hero.jpg";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function HeroSection({
  query,
  onQueryChange,
  selectedState,
  setSelectedState,
  selectedCity,
  setSelectedCity,
  onSearch,
  onOpenOwnerWizard,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  selectedState: string;
  setSelectedState: (s: string) => void;
  selectedCity: string;
  setSelectedCity: (c: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onOpenOwnerWizard?: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleQuickLink = (e: React.MouseEvent, params: { listing?: string; type?: string }) => {
    e.preventDefault();

    const targetState = selectedState || "Telangana";
    const targetCity = selectedCity || "Hyderabad";

    const searchParams = {
      q: "",
      state: targetState,
      city: targetCity,
      listing: params.listing || "",
      type: params.type || "",
      minPrice: 0,
      maxPrice: 0,
      beds: 0,
    };

    navigate({ to: "/properties", search: searchParams });
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="Modern sunlit living room representing Seedha Properties"
          className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/55 via-stone-900/25 to-stone-950/60" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:pt-28 flex flex-col items-center text-center">
        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl tracking-tight max-w-4xl [text-shadow:0_2px_14px_rgb(2_6_23_/_0.85)]"
        >
          {t("hero.title", "Find Your Next Home Directly from Verified Owners")}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="mt-3 text-base text-white/90 sm:text-lg max-w-2xl [text-shadow:0_1px_10px_rgb(2_6_23_/_0.8)]"
        >
          {t(
            "hero.subtitle",
            "Direct connections with verified property owners. No brokers, no hidden fees, and zero commissions across Hyderabad.",
          )}
        </motion.p>

        {/* Search Bar — flat single-row pill matching the reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-8 w-full max-w-4xl"
        >
          <TabbedSearchBox
            query={query}
            onQueryChange={onQueryChange}
            selectedState={selectedState}
            onStateChange={setSelectedState}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
          />
        </motion.div>

        {/* Quick Category Action Cards */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-4xl">
          {/* Buy */}
          <button
            onClick={(e) => handleQuickLink(e, { listing: "sale" })}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 shadow-md backdrop-blur-md border border-white/40 hover:border-blue-500/50 hover:shadow-lg transition-all active:scale-95 group text-left cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-none group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-extrabold text-foreground leading-tight">
                {t("hero.quick_buy", "Buy")}
              </span>
              <span className="block text-xs font-medium text-muted-foreground">
                {t("hero.quick_buy_desc", "Properties")}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 flex-none transition-colors" />
          </button>

          {/* Rent */}
          <button
            onClick={(e) => handleQuickLink(e, { listing: "rent" })}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 shadow-md backdrop-blur-md border border-white/40 hover:border-amber-500/50 hover:shadow-lg transition-all active:scale-95 group text-left cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-none group-hover:scale-105 transition-transform">
              <Home className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-extrabold text-foreground leading-tight">
                {t("hero.quick_rent", "Rent")}
              </span>
              <span className="block text-xs font-medium text-muted-foreground">
                {t("hero.quick_rent_desc", "Homes")}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 flex-none transition-colors" />
          </button>

          {/* Commercial */}
          <button
            onClick={(e) => handleQuickLink(e, { type: "commercial" })}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 shadow-md backdrop-blur-md border border-white/40 hover:border-cyan-500/50 hover:shadow-lg transition-all active:scale-95 group text-left cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-none group-hover:scale-105 transition-transform">
              <Building className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-extrabold text-foreground leading-tight truncate">
                {t("hero.quick_commercial", "Commercial")}
              </span>
              <span className="block text-xs font-medium text-muted-foreground truncate">
                {t("hero.quick_commercial_desc", "Spaces")}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-cyan-500 flex-none transition-colors" />
          </button>

          {/* Post Property (does not require location) */}
          <Link
            to="/list-property"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md text-white border border-emerald-400/40 hover:shadow-lg transition-all active:scale-95 group text-left"
          >
            <div className="h-10 w-10 rounded-xl bg-white/20 text-white flex items-center justify-center flex-none group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-extrabold leading-tight">Post Property</span>
              <span className="block text-xs font-bold text-emerald-100">Free Ad</span>
            </div>
            <ChevronRight className="h-4 w-4 text-white/70 group-hover:text-white flex-none transition-colors" />
          </Link>
        </div>

        {/* Trust strip — compact chips below action cards */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {(
            [
              { icon: ShieldCheck, label: "Verified Owners", color: "text-emerald-500" },
              { icon: CheckCircle2, label: "Zero Brokerage", color: "text-amber-500" },
              { icon: Zap, label: "Quick Response", color: "text-blue-400" },
            ] as const
          ).map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm"
            >
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <span className="text-xs font-semibold text-gray-800">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
