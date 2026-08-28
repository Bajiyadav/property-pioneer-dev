import { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  ShieldCheck,
  Phone,
  User,
  MapPin,
  Building,
  Briefcase,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { logLiveActivity } from "@/lib/leadRouting";
import { ESTABLISHED_BANKS } from "../utils/loanCalculations";

interface Props {
  selectedBank?: string;
  prefillAmount?: number;
}

export function LoanInquiryForm({
  selectedBank = "State Bank of India (SBI)",
  prefillAmount,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [loanAmount, setLoanAmount] = useState<number>(prefillAmount || 5000000);
  const [employmentType, setEmploymentType] = useState<
    "salaried" | "self-employed" | "professional" | "business"
  >("salaried");
  const [preferredBank, setPreferredBank] = useState(selectedBank);
  const [consent, setConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sync preferred bank if parent changes selection
  useEffect(() => {
    if (selectedBank) {
      setPreferredBank(selectedBank);
    }
  }, [selectedBank]);

  // Pre-fill location from session storage if selected by the customer
  useEffect(() => {
    try {
      const savedCity = sessionStorage.getItem("seedha_selected_city");
      if (savedCity) {
        setCity(savedCity);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error("Please enter your valid full name");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const validIndianPhone = /^[6-9]\d{9}$/.test(cleanPhone.slice(-10));
    if (!validIndianPhone) {
      toast.error(
        "Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)",
      );
      return;
    }

    if (!consent) {
      toast.error("Please agree to receive loan assistance communication");
      return;
    }

    // Client-side rate limiting / spam prevention
    const lastSubmit = sessionStorage.getItem("last_loan_inquiry_ts");
    if (lastSubmit && Date.now() - Number(lastSubmit) < 60000) {
      toast.error(
        "You recently submitted an inquiry. Please wait a minute before submitting another.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Log lead to live_activities table for real-time lead dispatch
      await logLiveActivity({
        activity_type: "enquiry",
        locality: city,
        city,
        contact_name: fullName.trim(),
        contact_phone: `+91 ${cleanPhone.slice(-10)}`,
        search_query: `[Home Loan Inquiry] Lender: ${preferredBank} | Amount: ₹${loanAmount.toLocaleString("en-IN")} | Employment: ${employmentType}`,
      });

      sessionStorage.setItem("last_loan_inquiry_ts", String(Date.now()));
      setIsSubmitted(true);
      toast.success("Home Loan Assistance Request Submitted!", {
        description: `Our dedicated loan coordinator will contact you at +91 ${cleanPhone.slice(-10)} shortly.`,
      });
    } catch {
      toast.error(
        "Unable to submit loan inquiry right now. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center shadow-xs">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-2xl font-black text-foreground">Inquiry Received Successfully!</h3>
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-muted-foreground">
          Thank you, <span className="font-semibold text-foreground">{fullName}</span>. Your home
          loan assistance inquiry for{" "}
          <span className="font-semibold text-foreground">{preferredBank}</span> has been logged.
          Our dedicated lending coordinator will reach out to verify your requirements and guide
          your application.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFullName("");
              setPhone("");
            }}
            className="rounded-xl border border-border bg-card px-6 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/60 transition"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="loan-inquiry-section"
      className="rounded-3xl border border-border bg-card p-6 shadow-xs md:p-8 space-y-6"
    >
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Zero-Brokerage Financing Assistance
        </span>
        <h3 className="mt-2 text-xl font-black text-foreground sm:text-2xl">
          Request Seedha Home Loan Assistance
        </h3>
        <p className="text-xs text-muted-foreground sm:text-sm mt-1">
          Connect with dedicated banking officers for doorstep document pickup, technical valuation,
          and structured sanction.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:border-primary focus:outline-none"
            />
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" /> Mobile Number
            </label>
            <div className="flex rounded-xl border border-border bg-background overflow-hidden focus-within:border-primary">
              <span className="bg-muted/40 px-3 py-2.5 text-xs sm:text-sm font-semibold text-muted-foreground border-r border-border">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Property City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:border-primary focus:outline-none"
            >
              <option value="Hyderabad">Hyderabad</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Pune">Pune</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Ahmedabad">Ahmedabad</option>
            </select>
          </div>

          {/* Loan Amount Needed */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Required Loan Amount (₹)</label>
            <select
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:border-primary focus:outline-none"
            >
              <option value={2500000}>₹25 Lakhs</option>
              <option value={5000000}>₹50 Lakhs</option>
              <option value={7500000}>₹75 Lakhs</option>
              <option value={10000000}>₹1 Crore</option>
              <option value={15000000}>₹1.5 Crore</option>
              <option value={25000000}>₹2.5 Crore+</option>
            </select>
          </div>

          {/* Employment Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-primary" /> Employment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEmploymentType("salaried")}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  employmentType === "salaried"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-secondary/30 text-muted-foreground"
                }`}
              >
                Salaried
              </button>
              <button
                type="button"
                onClick={() => setEmploymentType("self-employed")}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  employmentType === "self-employed"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-secondary/30 text-muted-foreground"
                }`}
              >
                Self-Employed / Business
              </button>
            </div>
          </div>

          {/* Preferred Bank */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-primary" /> Preferred Lender
            </label>
            <select
              value={preferredBank}
              onChange={(e) => setPreferredBank(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:border-primary focus:outline-none"
            >
              {ESTABLISHED_BANKS.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name} ({b.category})
                </option>
              ))}
              <option value="Any (Best Rate Available)">
                Any (Best Indicative Rate Available)
              </option>
            </select>
          </div>
        </div>

        {/* Consent Checkbox */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
          <span className="text-xs text-muted-foreground">
            I authorize Seedha Properties and its verified banking partners to contact me via
            Call/SMS/WhatsApp regarding my home loan inquiry.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98]"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Submitting Request..." : "Request Call from Home Loan Specialist"}
        </button>
      </form>

      <div className="flex items-start gap-2 rounded-2xl border border-border/80 bg-secondary/20 p-3.5 text-[11px] text-muted-foreground leading-relaxed">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          <strong>Privacy &amp; Safety:</strong> Seedha Properties does not charge any processing
          commission to buyers. Your contact information is shared strictly with authorized banking
          officers for credit evaluation.
        </span>
      </div>
    </div>
  );
}
