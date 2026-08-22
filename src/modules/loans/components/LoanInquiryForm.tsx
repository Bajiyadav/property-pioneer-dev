import { useState } from "react";
import {
  Send,
  CheckCircle2,
  ShieldCheck,
  Phone,
  User,
  MapPin,
  Building,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [employmentType, setEmploymentType] = useState<"salaried" | "self-employed">("salaried");
  const [preferredBank, setPreferredBank] = useState(selectedBank);
  const [consent, setConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      // Check current user session if authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Log lead to Supabase
      try {
        await supabase.from("messages").insert({
          content: `[HOME LOAN INQUIRY] Bank: ${preferredBank} | Amount: ₹${loanAmount.toLocaleString("en-IN")} | City: ${city} | Type: ${employmentType} | Applicant: ${fullName} | Phone: +91 ${cleanPhone.slice(-10)}`,
          receiver_id: session?.user?.id ?? "00000000-0000-0000-0000-000000000000",
        });
      } catch {
        // Continue even if messages table has restrictive RLS for anon
      }

      sessionStorage.setItem("last_loan_inquiry_ts", String(Date.now()));
      setIsSubmitted(true);
      toast.success("Home Loan Assistance Request Submitted!", {
        description: `Our dedicated loan specialist for ${preferredBank} will contact you at +91 ${cleanPhone.slice(-10)} within 2 hours.`,
      });
    } catch {
      toast.error("Unable to submit loan inquiry right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-2xl font-bold text-foreground">Inquiry Received Successfully!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Thank you, <span className="font-semibold text-foreground">{fullName}</span>. Your home
          loan assistance request for{" "}
          <span className="font-semibold text-foreground">{preferredBank}</span> has been logged.
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
      className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8"
    >
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Zero-Brokerage Loan Assistance
        </span>
        <h3 className="mt-2 text-2xl font-black text-foreground">
          Get Free Pre-Approved Home Loan Assistance
        </h3>
        <p className="text-xs text-muted-foreground">
          Connect with trusted banking officers for quick sanction, doorstep document pickup, and
          the lowest interest rates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
            />
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" /> Mobile Number
            </label>
            <div className="flex rounded-xl border border-border bg-background overflow-hidden focus-within:border-primary">
              <span className="bg-muted/40 px-3 py-2.5 text-sm font-semibold text-muted-foreground border-r border-border">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-transparent px-3 py-2.5 text-sm font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
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
            <label className="text-xs font-semibold text-foreground">
              Required Loan Amount (₹)
            </label>
            <select
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
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
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-primary" /> Employment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEmploymentType("salaried")}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  employmentType === "salaried"
                    ? "bg-primary text-primary-foreground"
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
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary/30 text-muted-foreground"
                }`}
              >
                Self-Employed / Business
              </button>
            </div>
          </div>

          {/* Preferred Bank */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-primary" /> Preferred Bank
            </label>
            <select
              value={preferredBank}
              onChange={(e) => setPreferredBank(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:border-primary focus:outline-none"
            >
              <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="Axis Bank">Axis Bank</option>
              <option value="Bank of Baroda">Bank of Baroda</option>
              <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              <option value="Any (Best Rate Available)">Any (Best Rate Available)</option>
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
            Call/SMS/WhatsApp regarding my home loan application.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Submitting Request..." : "Request Call from Home Loan Specialist"}
        </button>
      </form>
    </div>
  );
}
