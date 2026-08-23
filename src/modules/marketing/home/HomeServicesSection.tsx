import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { HOME_SERVICES_LIST } from "@/config/services";

export function HomeServicesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            Home Services
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified doorstep essentials for smooth renting & living
          </p>
        </div>
        <Link
          to="/services"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <span>See All</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
        {HOME_SERVICES_LIST.map((srv) => {
          const Icon = srv.icon;
          return (
            <Link
              key={srv.id}
              to={srv.to}
              className="group relative flex flex-col items-center justify-between p-3.5 rounded-2xl border border-border/70 bg-card hover:border-emerald-500/50 hover:shadow-md transition-all text-center"
            >
              {srv.tag && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 shadow-xs whitespace-nowrap">
                  {srv.tag}
                </span>
              )}

              <div
                className={`h-12 w-12 rounded-2xl ${srv.iconBg} ${srv.iconColor} flex items-center justify-center mb-2.5 transition-transform duration-200 group-hover:scale-110`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <span className="text-xs font-bold text-foreground line-clamp-1 leading-snug">
                {srv.name}
              </span>
              <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {srv.description}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
