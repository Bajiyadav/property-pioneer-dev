import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  FileText,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Download,
  Calculator,
  HelpCircle,
  Star,
  Clock,
  Building,
  UserCheck,
  Truck,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Lock,
} from "lucide-react";
import { APP_NAME } from "@/config/app";
import { toast } from "sonner";

export const Route = createFileRoute("/rental-agreement")({
  head: () => ({
    meta: [
      { title: `Online Rent Agreement in Hyderabad & India — ${APP_NAME}` },
      {
        name: "description",
        content: `Create legally valid online rent agreements in Hyderabad with e-stamping, Aadhaar e-signing, and doorstep delivery. Calculate stamp duty and get soft copies in 24 hours.`,
      },
      { property: "og:title", content: `Online Rent Agreement in Hyderabad & India — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Fast, legally compliant rental agreements online. Aadhaar E-Sign, valid stamp paper, and 24-hour delivery in Hyderabad.`,
      },
    ],
  }),
  component: RentalAgreementPage,
});

interface StateDutyConfig {
  name: string;
  calcDuty: (annualRent: number, deposit: number, months: number) => number;
  fixedFee: number;
  desc: string;
}

const STATE_DUTIES: Record<string, StateDutyConfig> = {
  Telangana: {
    name: "Telangana (Hyderabad)",
    calcDuty: (annualRent, deposit) =>
      Math.max(100, Math.round((annualRent + deposit * 0.1) * 0.005)),
    fixedFee: 299,
    desc: "0.5% of annual rent + 10% deposit (Min ₹100 stamp paper)",
  },
  Karnataka: {
    name: "Karnataka (Bangalore)",
    calcDuty: (annualRent, deposit) => Math.max(200, Math.round((annualRent + deposit) * 0.005)),
    fixedFee: 349,
    desc: "0.5% of annual rent + deposit (Min ₹200 e-stamp)",
  },
  Maharashtra: {
    name: "Maharashtra (Mumbai/Pune)",
    calcDuty: (annualRent, deposit, months) =>
      Math.max(500, Math.round(((annualRent / 12) * months + deposit * 0.1) * 0.0025)),
    fixedFee: 399,
    desc: "0.25% of total consideration value",
  },
  "Delhi NCR": {
    name: "Delhi NCR (Delhi/Noida/Gurgaon)",
    calcDuty: () => 100,
    fixedFee: 299,
    desc: "₹100 for standard 11-month agreement",
  },
  "Tamil Nadu": {
    name: "Tamil Nadu (Chennai)",
    calcDuty: (annualRent, deposit) => Math.max(100, Math.round((annualRent + deposit) * 0.01)),
    fixedFee: 299,
    desc: "1% of total rent + deposit value",
  },
};

const ADD_ONS = [
  {
    id: "notary",
    title: "Notarised Agreement",
    desc: "Official notary seal and stamp — valid as address proof for passport, bank, and government verification.",
    price: 349,
    popular: true,
  },
  {
    id: "esign",
    title: "Aadhaar Digital E-Sign",
    desc: "Remote biometric/OTP e-sign for landlords & tenants in different cities without physical meeting.",
    price: 199,
    popular: true,
  },
  {
    id: "verification",
    title: "Instant Tenant PAN/ID Verification",
    desc: "Verify tenant credentials and identity instantly against official government databases.",
    price: 149,
    popular: false,
  },
  {
    id: "hardcopy",
    title: "Extra Original Physical Copy",
    desc: "One original copy for the landlord and one for the tenant with doorstep courier delivery.",
    price: 249,
    popular: false,
  },
];

const FAQS = [
  {
    q: "Is an online rental agreement legally valid in Hyderabad and India?",
    a: "Yes. Online rent agreements executed on state-approved e-stamp paper and signed via Aadhaar e-Sign or physical signatures are 100% legally binding and admissible in court under the Indian Evidence Act and Information Technology Act.",
  },
  {
    q: "Why are 11-month rent agreements so standard in India?",
    a: "Under the Registration Act of 1908, leases of immovable property for a term exceeding 11 months require mandatory registration. An 11-month agreement avoids mandatory registrar office visits while remaining legally enforceable.",
  },
  {
    q: "How fast do I receive my rental agreement?",
    a: "You receive a draft within 30 minutes of submission. Once approved and e-signed, the final legally stamped digital copy is delivered within 24 hours. Physical stamp copies are delivered to your doorstep within 1–3 business days.",
  },
  {
    q: "Can the owner and tenant sign from different cities?",
    a: "Absolutely! With our Aadhaar E-Sign add-on, both parties receive a secure link to sign using their Aadhaar-linked mobile number from anywhere in the world.",
  },
  {
    q: "What documents are required to generate an agreement?",
    a: "You only need basic details: Landlord & Tenant names, Aadhaar/PAN details, property address, monthly rent amount, security deposit, and agreed notice/lock-in terms.",
  },
];

function RentalAgreementPage() {
  // Calculator State
  const [selectedState, setSelectedState] = useState("Telangana");
  const [rent, setRent] = useState<number>(25000);
  const [deposit, setDeposit] = useState<number>(50000);
  const [durationMonths, setDurationMonths] = useState<number>(11);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(["notary", "esign"]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Drafting Form Modal / Drawer State
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftStep, setDraftStep] = useState(1);
  const [formData, setFormData] = useState({
    city: "Hyderabad",
    locality: "Gachibowli",
    propertyAddress: "",
    landlordName: "",
    landlordPhone: "",
    tenantName: "",
    tenantPhone: "",
    startDate: new Date().toISOString().split("T")[0],
    maintenanceCharges: 2000,
    noticePeriodMonths: 1,
    lockInMonths: 6,
  });

  const stateConfig = STATE_DUTIES[selectedState] || STATE_DUTIES["Telangana"];

  const calculations = useMemo(() => {
    const annualRent = rent * 12;
    const stampDuty = stateConfig.calcDuty(annualRent, deposit, durationMonths);
    const draftingFee = stateConfig.fixedFee;
    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const item = ADD_ONS.find((a) => a.id === id);
      return sum + (item ? item.price : 0);
    }, 0);

    const total = stampDuty + draftingFee + addonsTotal;
    return {
      stampDuty,
      draftingFee,
      addonsTotal,
      total,
    };
  }, [rent, deposit, durationMonths, selectedState, selectedAddons, stateConfig]);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleStartDraft = () => {
    setIsDrafting(true);
    setDraftStep(1);
  };

  const handleDraftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      "Draft submitted successfully! Our legal team is preparing your e-stamp agreement.",
    );
    setIsDrafting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 space-y-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-border/40 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold text-primary tracking-wide shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>4.8★ • 50,000+ Legally Valid Agreements</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
                Online Rent Agreement in <span className="text-primary">Hyderabad</span> &amp;
                Across India
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl">
                Create legally binding, government-stamped rental agreements without visiting
                sub-registrar offices or local typists. Includes instant Aadhaar E-Sign and 24-hour
                soft copy delivery.
              </p>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl bg-card border border-border/80 p-3 text-center shadow-2xs">
                  <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-[11px] font-bold text-foreground">Same-Day Soft Copy</p>
                  <p className="text-[10px] text-muted-foreground">Within 24 Hours</p>
                </div>
                <div className="rounded-2xl bg-card border border-border/80 p-3 text-center shadow-2xs">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-[11px] font-bold text-foreground">100% Legally Valid</p>
                  <p className="text-[10px] text-muted-foreground">Govt E-Stamp Paper</p>
                </div>
                <div className="rounded-2xl bg-card border border-border/80 p-3 text-center shadow-2xs">
                  <Zap className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-[11px] font-bold text-foreground">Aadhaar E-Sign</p>
                  <p className="text-[10px] text-muted-foreground">Remote Signing</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={handleStartDraft}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-extrabold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  <FileText className="h-4 w-4" /> Start Creating Agreement
                </button>
                <a
                  href="#calculator"
                  className="inline-flex items-center gap-2 rounded-full bg-secondary border border-border/80 px-6 py-3.5 text-sm font-bold text-foreground transition hover:bg-secondary/80 shadow-2xs"
                >
                  <Calculator className="h-4 w-4" /> Calculate Stamp Duty
                </a>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-primary/30 bg-card/95 p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-5 ring-1 ring-primary/20">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="font-extrabold text-foreground text-base">
                      Quick Cost Estimate
                    </h3>
                    <p className="text-xs text-muted-foreground">{stateConfig.name}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-black">
                    Standard 11M
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Govt Stamp Duty</span>
                    <span className="font-semibold text-foreground">
                      ₹{calculations.stampDuty.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Legal Drafting &amp; E-Stamp Processing</span>
                    <span className="font-semibold text-foreground">
                      ₹{calculations.draftingFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Selected Add-ons ({selectedAddons.length})</span>
                    <span className="font-semibold text-foreground">
                      ₹{calculations.addonsTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="font-extrabold text-sm text-foreground">
                      Total Payable Amount
                    </span>
                    <span className="text-xl font-black text-primary">
                      ₹{calculations.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartDraft}
                  className="w-full rounded-2xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-md transition hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  Create Agreement for ₹{calculations.total.toLocaleString()}
                </button>

                <p className="text-[11px] text-center text-muted-foreground">
                  🔒 Encrypted &amp; legally valid under the Indian Stamp Act
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Calculator Section */}
      <section id="calculator" className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8 scroll-mt-20">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
            <Calculator className="h-3.5 w-3.5" /> Instant Pricing Engine
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Rent Agreement Cost &amp; Stamp Duty Calculator
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Accurately calculated according to state-specific stamp duty and legal regulations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md">
          {/* Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* State Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Where is your property located?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.keys(STATE_DUTIES).map((stateKey) => (
                  <button
                    key={stateKey}
                    type="button"
                    onClick={() => setSelectedState(stateKey)}
                    className={`rounded-xl px-3 py-2.5 text-xs font-bold transition text-left border cursor-pointer ${
                      selectedState === stateKey
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {stateKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Rent */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-foreground">Monthly Rent (₹)</label>
                <span className="text-xs font-black text-primary">₹{rent.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={200000}
                step={1000}
                value={rent}
                onChange={(e) => setRent(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>₹5,000</span>
                <span>₹1,00,000</span>
                <span>₹2,00,000+</span>
              </div>
            </div>

            {/* Security Deposit */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-foreground">Security Deposit (₹)</label>
                <span className="text-xs font-black text-primary">₹{deposit.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={10000}
                max={500000}
                step={5000}
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>₹10,000</span>
                <span>₹2,50,000</span>
                <span>₹5,00,000+</span>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Agreement Duration</label>
              <div className="flex flex-wrap gap-2">
                {[11, 12, 24, 36].map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setDurationMonths(months)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition border cursor-pointer ${
                      durationMonths === months
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {months} Months {months === 11 && "★ Most Popular"}
                  </button>
                ))}
              </div>
            </div>

            {/* Addons Selection */}
            <div className="space-y-2.5 pt-2">
              <label className="text-xs font-bold text-foreground">
                Optional Value-Added Services
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ADD_ONS.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isChecked
                          ? "bg-primary/5 border-primary/60 ring-1 ring-primary/20"
                          : "bg-card border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-foreground">{addon.title}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                            {addon.desc}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 h-4 w-4 rounded accent-primary cursor-pointer shrink-0"
                        />
                      </div>
                      <p className="text-xs font-black text-primary mt-2">+₹{addon.price}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Breakdown Receipt */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-secondary/40 border border-border/80 p-6 space-y-6">
            <div>
              <h3 className="font-extrabold text-foreground text-base border-b border-border pb-3">
                Calculation Breakdown
              </h3>
              <div className="space-y-3.5 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State Duty Rule</span>
                  <span className="font-semibold text-foreground text-right">
                    {stateConfig.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenure</span>
                  <span className="font-semibold text-foreground">{durationMonths} Months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stamp Duty Charge</span>
                  <span className="font-semibold text-foreground">
                    ₹{calculations.stampDuty.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Legal Drafting &amp; E-Stamp Paper</span>
                  <span className="font-semibold text-foreground">
                    ₹{calculations.draftingFee.toLocaleString()}
                  </span>
                </div>
                {selectedAddons.map((id) => {
                  const item = ADD_ONS.find((a) => a.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex justify-between text-muted-foreground">
                      <span>{item.title}</span>
                      <span className="font-semibold text-foreground">+₹{item.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Total Amount
                  </p>
                  <p className="text-2xl font-black text-foreground">
                    ₹{calculations.total.toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-black">
                  Zero Hidden Fees
                </span>
              </div>
              <button
                type="button"
                onClick={handleStartDraft}
                className="w-full rounded-2xl bg-primary py-3.5 text-sm font-black text-primary-foreground shadow-md transition hover:brightness-110 active:scale-95 cursor-pointer"
              >
                Proceed to Draft Agreement <ArrowRight className="h-4 w-4 inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works (4 Simple Steps) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            How It Works in 4 Simple Steps
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Complete the entire rental documentation from the comfort of your home.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-3 shadow-sm relative">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs">
              1
            </span>
            <h3 className="font-bold text-foreground text-sm">Enter Details</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fill in owner, tenant, property address, and monthly rent details in under 3 minutes.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-3 shadow-sm relative">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs">
              2
            </span>
            <h3 className="font-bold text-foreground text-sm">Drafting &amp; E-Stamping</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our legal team formats state-compliant clauses and prints onto official government
              e-stamp paper.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-3 shadow-sm relative">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs">
              3
            </span>
            <h3 className="font-bold text-foreground text-sm">Aadhaar E-Sign</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sign remotely using Aadhaar OTP verification. Both parties sign digitally with zero
              physical hassle.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-3 shadow-sm relative">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs">
              4
            </span>
            <h3 className="font-bold text-foreground text-sm">Instant Delivery</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Download your signed, stamped soft copy within 24 hours. Physical hard copy delivered
              in 1–3 days.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Comparison Table: SEEDHA vs Local Vendors */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-md">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {APP_NAME} vs. Traditional Offline Vendors
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Why thousands of landlords and tenants in Hyderabad switch to digital agreements
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 font-bold">Feature / Service</th>
                  <th className="py-3 font-extrabold text-primary">{APP_NAME} Platform</th>
                  <th className="py-3 font-bold text-muted-foreground">Local Stamp Vendors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-3.5 font-semibold text-foreground">Turnaround Time</td>
                  <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    Soft copy in 24 Hours
                  </td>
                  <td className="py-3.5 text-muted-foreground">3 to 7 Days (Multiple visits)</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-foreground">Remote Signing</td>
                  <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    Aadhaar OTP E-Sign (Pan-India)
                  </td>
                  <td className="py-3.5 text-muted-foreground">Both parties must meet in person</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-foreground">Custom Legal Clauses</td>
                  <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    Customizable lock-in, pet &amp; notice clauses
                  </td>
                  <td className="py-3.5 text-muted-foreground">
                    Rigid, outdated standard template
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-foreground">Pricing Transparency</td>
                  <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    Transparent government stamp duty + flat fee
                  </td>
                  <td className="py-3.5 text-muted-foreground">
                    Arbitrary typing &amp; broker markups
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold text-foreground">Digital Backup</td>
                  <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    Lifetime cloud storage on dashboard
                  </td>
                  <td className="py-3.5 text-muted-foreground">
                    No digital copy; lost if misplaced
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. State-wise Stamp Duty Details */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            State-wise Stamp Duty &amp; Legal Rates
          </h3>
          <p className="text-xs text-muted-foreground">
            Standard residential rates for 11-month agreements
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {Object.entries(STATE_DUTIES).map(([key, config]) => (
            <div
              key={key}
              className="rounded-2xl border border-border/80 bg-card p-4 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground">{config.name}</h4>
                <Building className="h-4 w-4 text-primary" />
              </div>
              <p className="text-muted-foreground leading-relaxed">{config.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQs Accordion */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            Frequently Asked Questions
          </h3>
          <p className="text-xs text-muted-foreground">
            Everything you need to know about digital rent agreements
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden transition shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-foreground hover:bg-secondary/40 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-primary shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Bottom CTA Banner */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 p-8 sm:p-10 text-white text-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to Generate Your Rent Agreement?
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Get your government-stamped, legally compliant agreement drafted in minutes. Free
            delivery across Hyderabad.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleStartDraft}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-xs sm:text-sm font-black text-emerald-800 shadow-md hover:bg-emerald-50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Start Creating Agreement Now <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 8. Interactive Agreement Drafting Modal */}
      {isDrafting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black text-foreground">Create Rental Agreement</h3>
                <p className="text-xs text-muted-foreground">Step {draftStep} of 3</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrafting(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground p-2 rounded-full bg-secondary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDraftSubmit} className="space-y-4 text-xs">
              {draftStep === 1 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" /> Property &amp; Locality Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Locality</label>
                      <input
                        type="text"
                        value={formData.locality}
                        onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Complete Property Address</label>
                    <textarea
                      value={formData.propertyAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, propertyAddress: e.target.value })
                      }
                      placeholder="Flat No, Building Name, Street, Landmark, Pincode"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary h-20"
                      required
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setDraftStep(2)}
                      className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground text-xs shadow-sm hover:brightness-110 cursor-pointer"
                    >
                      Next: Parties Details →
                    </button>
                  </div>
                </div>
              )}

              {draftStep === 2 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" /> Landlord &amp; Tenant Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Landlord Full Name</label>
                      <input
                        type="text"
                        value={formData.landlordName}
                        onChange={(e) => setFormData({ ...formData, landlordName: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">
                        Landlord Mobile (for E-Sign)
                      </label>
                      <input
                        type="tel"
                        value={formData.landlordPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, landlordPhone: e.target.value })
                        }
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Tenant Full Name</label>
                      <input
                        type="text"
                        value={formData.tenantName}
                        onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">
                        Tenant Mobile (for E-Sign)
                      </label>
                      <input
                        type="tel"
                        value={formData.tenantPhone}
                        onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setDraftStep(1)}
                      className="rounded-full bg-secondary px-5 py-2.5 font-bold text-foreground text-xs border border-border cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftStep(3)}
                      className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground text-xs shadow-sm hover:brightness-110 cursor-pointer"
                    >
                      Next: Terms &amp; Submit →
                    </button>
                  </div>
                </div>
              )}

              {draftStep === 3 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-primary" /> Tenancy Terms &amp; Final Review
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Agreement Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Lock-in Period (Months)</label>
                      <input
                        type="number"
                        value={formData.lockInMonths}
                        onChange={(e) =>
                          setFormData({ ...formData, lockInMonths: Number(e.target.value) })
                        }
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-secondary/60 border border-border space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Rent</span>
                      <span className="font-bold text-foreground">₹{rent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Security Deposit</span>
                      <span className="font-bold text-foreground">₹{deposit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/60 pt-2">
                      <span className="font-extrabold text-foreground">Total Payable</span>
                      <span className="font-black text-primary text-sm">
                        ₹{calculations.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setDraftStep(2)}
                      className="rounded-full bg-secondary px-5 py-2.5 font-bold text-foreground text-xs border border-border cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-600 px-7 py-2.5 font-black text-white text-xs shadow-md hover:bg-emerald-500 cursor-pointer"
                    >
                      Submit &amp; Generate Agreement
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
