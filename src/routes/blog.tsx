import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Bell, Rss, TrendingUp, Users, MapPin, ArrowRight, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";

const SUPPORT_EMAIL = "support@urbanproperties.in";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/blog")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/blog");
    const ogImage = getOgImageUrl();
    const title = `Real Estate Blog & Insights — ${APP_NAME}`;
    const description = `Expert insights, market trends, and guides on buying, renting, and investing in Indian real estate from the team at ${APP_NAME}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: BlogPage,
});

const COMING_SOON_TOPICS = [
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    desc: "Monthly price trends, demand hotspots, and investment return analysis for Hyderabad micro-markets.",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: Users,
    title: "Buyer & Renter Guides",
    desc: "Step-by-step guides to buying your first home, understanding EMI, RERA compliance, and negotiation tactics.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: MapPin,
    title: "Neighbourhood Spotlights",
    desc: "Deep dives into Madhapur, Hitech City, Gachibowli, Kondapur, Financial District, and upcoming zones.",
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    icon: Rss,
    title: "Policy & Regulatory Updates",
    desc: "RERA amendments, stamp duty changes, GST on real estate, and government housing scheme updates.",
    color: "text-amber-500 bg-amber-500/10",
  },
];

function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-blue-900/20 via-background to-background px-6 py-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-800/10 to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-400">
            <BookOpen className="h-3 w-3" /> Urban Properties Blog
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Real Estate <span className="text-blue-400">Intelligence</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto">
            Expert guides, market data, and neighbourhood insights to make your next property
            decision the smartest one yet.
          </p>

          {/* Subscribe CTA */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                "Blog launch notification",
              )}&body=${encodeURIComponent("Please notify me when the Urban Properties blog launches.")}`;
            }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 mx-auto max-w-md"
          >
            <input
              type="email"
              required
              placeholder="Enter your email for early access"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="flex-none rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-500 transition"
            >
              Notify Me
            </button>
          </form>
        </div>
      </div>

      {/* Coming Soon Topics */}
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-400">
            <Clock className="h-3 w-3" /> Coming Soon
          </div>
          <h2 className="mt-3 text-2xl font-extrabold text-foreground">What's Coming</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Our editorial team is crafting in-depth content across these pillars.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {COMING_SOON_TOPICS.map((topic) => (
            <div
              key={topic.title}
              className="rounded-3xl border border-border/60 bg-card p-6 hover:border-border transition"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${topic.color}`}
              >
                <topic.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-extrabold text-foreground">{topic.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{topic.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/properties"
            search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow hover:brightness-110 transition"
          >
            Browse Properties Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
