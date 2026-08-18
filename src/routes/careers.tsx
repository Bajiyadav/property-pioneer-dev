import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Linkedin,
  Mail,
  CheckCircle2,
} from "lucide-react";
import founderImg from "@/assets/founder.png";

export const Route = createFileRoute("/careers")({
  component: CareersPage,
});

const OPEN_POSITIONS = [
  {
    id: "eng-flutter-react",
    title: "Lead Full-Stack / Mobile Engineer (Flutter & React)",
    department: "Engineering",
    location: "Hyderabad / Hybrid",
    type: "Full-time",
    experience: "2-5 years",
    description:
      "Architect and scale our multi-platform web & mobile applications (TanStack Start, Flutter, Supabase) powering zero-brokerage direct connections for thousands of users across India.",
    tags: ["Flutter", "TypeScript", "React", "Supabase", "PostgreSQL"],
  },
  {
    id: "growth-marketing-lead",
    title: "Growth & Community Marketing Lead",
    department: "Marketing & Growth",
    location: "Hyderabad",
    type: "Full-time",
    experience: "2-4 years",
    description:
      "Drive owner acquisition and tenant demand across major Hyderabad tech hubs (Gachibowli, Hitech City, Kondapur, Financial District) through high-velocity digital and on-ground campaigns.",
    tags: ["Growth Hacking", "Performance Marketing", "Real Estate", "Community"],
  },
  {
    id: "field-verification-ops",
    title: "Property Verification & Operations Specialist",
    department: "Operations",
    location: "Hyderabad (On-field)",
    type: "Full-time",
    experience: "1-3 years",
    description:
      "Ensure 100% listing honesty by conducting on-site property verifications, capturing authentic video tours, and onboarding direct property owners seamlessly.",
    tags: ["Operations", "Quality Assurance", "Customer Success", "Field"],
  },
  {
    id: "product-uiux-designer",
    title: "Product & UI/UX Designer",
    department: "Design",
    location: "Hyderabad / Remote",
    type: "Full-time",
    experience: "2-4 years",
    description:
      "Craft world-class architectural, high-conversion interfaces for web and mobile with precision micro-animations, glassmorphism, and intuitive owner/tenant workflows.",
    tags: ["Figma", "Design Systems", "Mobile UI", "Design Tokens"],
  },
];

function CareersPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/60 via-background to-secondary/30 py-20 sm:py-28 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-bold text-primary mb-5 shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Join the PropTech Revolution</span>
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-foreground sm:text-6xl tracking-tight max-w-3xl mx-auto leading-tight">
            Build India&apos;s Next-Gen Property Marketplace
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            At <strong className="text-foreground">SEEDHA Properties</strong>, we are disrupting the
            real estate industry by eliminating broker commissions, fake listings, and friction
            through verified direct owner connections.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#open-roles"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg transition-all active:scale-95"
            >
              <span>Explore Open Roles</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="mailto:careers@seedhaproperties.com"
              className="inline-flex items-center gap-2 rounded-full bg-card border border-border/80 px-6 py-3.5 text-sm font-bold text-foreground shadow-xs hover:border-primary hover:text-primary transition-all active:scale-95"
            >
              <Mail className="h-4 w-4" />
              <span>Direct HR Inquiry</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Meet Our Founder Feature Section */}
      <section className="py-20 sm:py-24 border-b border-border/60 bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground border border-border/50 mb-3">
              <span>Leadership &amp; Vision</span>
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-foreground sm:text-5xl tracking-tight">
              Meet Our Founder
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Driven by transparency, financial discipline, and a deep commitment to hassle-free
              housing.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-12 items-center bg-gradient-to-br from-secondary/40 via-card to-secondary/20 rounded-3xl border border-border/80 p-8 sm:p-12 shadow-[var(--shadow-card)]">
            {/* Left: Founder Portrait */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary/30 to-accent/30 opacity-70 blur-xl transition-all duration-500 group-hover:opacity-100" />
                <div className="relative overflow-hidden rounded-2xl border-2 border-border/80 bg-card shadow-xl max-w-sm">
                  <img
                    src={founderImg}
                    alt="Srinivasa Rao - Founder & CEO of SEEDHA Properties"
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white text-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                      Founder &amp; CEO
                    </span>
                    <p className="text-sm font-extrabold">Srinivasa Rao</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Founder Story & Credentials */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  PropTech Entrepreneur &amp; CA
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-2xl sm:text-4xl font-extrabold text-foreground mt-1">
                  Srinivasa Rao
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
                  Hyderabad, Telangana, India · The Institute of Chartered Accountants of India
                  (ICAI)
                </p>
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed">
                &ldquo;Having experienced the frustration of high broker commissions, unverified
                listings, and hidden charges firsthand, I founded <strong>SEEDHA Properties</strong>{" "}
                with a singular mission: to make renting, buying, and listing properties 100%
                direct, honest, and commission-free.&rdquo;
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Key Discipline
                  </span>
                  <span className="text-xs font-extrabold text-foreground">
                    Financial Advisory &amp; Analysis
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <span className="text-[11px] font-bold text-muted-foreground block">Mission</span>
                  <span className="text-xs font-extrabold text-foreground">
                    0% Brokerage Marketplace
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Headquarters
                  </span>
                  <span className="text-xs font-extrabold text-foreground">
                    Hyderabad, Telangana
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Platform Reach
                  </span>
                  <span className="text-xs font-extrabold text-foreground">
                    Web + Android Mobile App
                  </span>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <a
                  href="https://www.linkedin.com/in/srinivasa-rao-9520943a3/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0A66C2] hover:bg-[#084e96] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>Connect on LinkedIn</span>
                </a>
                <Link
                  to="/properties"
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground border border-border/60 transition-all"
                >
                  <span>Explore Our Marketplace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Values */}
      <section className="py-20 sm:py-24 border-b border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">
              Why Work at SEEDHA Properties?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We empower our team to solve real-world problems for millions of Indian tenants,
              buyers, and property owners.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">High-Impact Mission</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Directly save Indian families thousands of rupees in unnecessary broker commissions
                on every rental and sale transaction.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Modern Tech Stack</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Work with modern technologies including TanStack Start, React 19, TypeScript,
                Flutter, Tailwind CSS, and Supabase PostgreSQL.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Fast Career Growth</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Join at an early stage where your ideas shape the core product, culture, and
                long-term company roadmap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Open Positions Section */}
      <section id="open-roles" className="py-20 sm:py-24 bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary mb-2">
                <Briefcase className="h-3.5 w-3.5" />
                <span>Active Openings ({OPEN_POSITIONS.length})</span>
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">
                Find Your Role Here
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                Join our Hyderabad headquarters or explore hybrid positions across engineering,
                growth, and operations.
              </p>
            </div>
            <a
              href="mailto:careers@seedhaproperties.com?subject=General%20Application%20-%20SEEDHA%20Properties"
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border/80 px-4 py-2 text-xs font-bold text-foreground transition-all"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Don&apos;t see your role? Send CV</span>
            </a>
          </div>

          <div className="grid gap-6">
            {OPEN_POSITIONS.map((job) => (
              <div
                key={job.id}
                className="group rounded-2xl border border-border/80 bg-background p-6 sm:p-8 transition-all hover:border-primary/60 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {job.department}
                    </span>
                    <h3 className="text-xl font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:careers@seedhaproperties.com?subject=Application%20for%20${encodeURIComponent(job.title)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary/95 text-white px-5 py-2 text-xs font-bold shadow-xs transition-all active:scale-95"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                  {job.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {job.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {job.type} ({job.experience})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {job.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-lg bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground/80 border border-border/40"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Contact / Application Banner */}
      <section className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 py-16 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-extrabold">
            Ready to shape the future of real estate?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
            Send your resume and portfolio directly to our leadership team. We review every
            application carefully.
          </p>

          <div className="mt-6 flex flex-wrap justify-center items-center gap-4">
            <a
              href="mailto:careers@seedhaproperties.com"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md transition-all"
            >
              <Mail className="h-4 w-4" />
              <span>careers@seedhaproperties.com</span>
            </a>
            <a
              href="https://www.linkedin.com/in/srinivasa-rao-9520943a3/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 text-xs font-bold text-white transition-all"
            >
              <Linkedin className="h-4 w-4" />
              <span>Connect with Founder</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
