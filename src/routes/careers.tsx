import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
  X,
  FileText,
} from "lucide-react";
import founderImg from "@/assets/founder.png";
import { toast } from "sonner";
import { saveJobApplication } from "@/modules/admin/services/adminFunctions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";

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
  const [selectedJob, setSelectedJob] = useState<(typeof OPEN_POSITIONS)[0] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    resume_url: "",
    notes: "",
  });

  const handleOpenModal = (job: (typeof OPEN_POSITIONS)[0]) => {
    setSelectedJob(job);
    setFormData({
      name: "",
      email: "",
      phone: "",
      experience: job.experience,
      resume_url: "",
      notes: "",
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Please fill in your name, email, and phone number.");
      return;
    }

    const pureDigits = formData.phone.replace(/\D/g, "");
    if (pureDigits.length < 7 || pureDigits.length > 15) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    const formattedPhone = formData.phone.startsWith("+")
      ? formData.phone.replace(/[^\d+]/g, "")
      : `+91${pureDigits}`;

    setIsSubmitting(true);

    try {
      saveJobApplication({
        name: formData.name,
        email: formData.email,
        phone: formattedPhone,
        position: selectedJob?.title || "General Application",
        experience: formData.experience,
        resume_url:
          formData.resume_url ||
          `https://linkedin.com/in/${formData.name.toLowerCase().replace(/\s+/g, "-")}`,
        notes: formData.notes,
      });

      toast.success("Application submitted successfully!", {
        description: "Our hiring team will review your details and get in touch.",
      });

      setSelectedJob(null);
    } catch {
      toast.error("Could not submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <h3 className="text-2xl font-bold text-foreground mt-1">Srinivasa Rao</h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  Founder &amp; Chief Executive Officer
                </p>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                With extensive experience in financial architecture, governance, and consumer
                technology, Srinivasa Rao founded SEEDHA Properties to solve a fundamental problem
                facing urban housing: unjustified brokerage fees and dishonest property information.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-border/60 bg-background/60 p-3.5">
                  <span className="text-xs font-bold text-primary block">0% Brokerage</span>
                  <span className="text-[11px] text-muted-foreground">Direct Owner Connect</span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-3.5">
                  <span className="text-xs font-bold text-emerald-600 block">
                    Verified Listings
                  </span>
                  <span className="text-[11px] text-muted-foreground">Field Audit Passed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Open Positions Section */}
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
                    <button
                      type="button"
                      onClick={() => handleOpenModal(job)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary/95 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-all active:scale-95"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
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

      {/* 4. Application Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Briefcase className="h-5 w-5 text-primary" />
              Apply for {selectedJob?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Submit your profile directly to our hiring team. We review all applications within
              24-48 hours.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Full Name *</label>
              <Input
                required
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 text-sm rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Email Address *
                </label>
                <Input
                  required
                  type="email"
                  placeholder="rahul@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 text-sm rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Phone Number *
                </label>
                <Input
                  required
                  type="tel"
                  placeholder="6301196547"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10 text-sm rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                Years of Experience
              </label>
              <Input
                type="text"
                placeholder="e.g. 3 years"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="h-10 text-sm rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                Resume / LinkedIn / Portfolio URL
              </label>
              <Input
                type="url"
                placeholder="https://linkedin.com/in/yourprofile or Google Drive link"
                value={formData.resume_url}
                onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                className="h-10 text-sm rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                Cover Note / Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Tell us briefly why you're a great fit for this role..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 text-sm font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all uppercase tracking-wider"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
