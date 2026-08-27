/**
 * Seedha Properties — Formal Legal Rental Agreement Document Renderer & Print View
 */

import React, { useRef } from "react";
import {
  Printer,
  Copy,
  Check,
  Download,
  ShieldCheck,
  FileText,
  AlertCircle,
  Building,
  UserCheck,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { type RentalAgreementFormData, type AgreementStatus } from "../types";
import { STANDARD_CLAUSES } from "../constants/clauses";
import { toast } from "sonner";

interface AgreementDocumentPreviewProps {
  data: RentalAgreementFormData;
  agreementNumber?: string;
  status?: AgreementStatus;
  isPrintOnly?: boolean;
}

export const AgreementDocumentPreview: React.FC<AgreementDocumentPreviewProps> = ({
  data,
  agreementNumber = "SP-RA-DRAFT",
  status = "DRAFT",
  isPrintOnly = false,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const {
    agreementType,
    ownerDetails,
    tenants,
    propertyDetails,
    rentalTerms,
    clauses,
    customTerms,
  } = data;

  const isDraft = status === "DRAFT" || status === "REVIEW";

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (printRef.current) {
      navigator.clipboard.writeText(printRef.current.innerText);
      setCopied(true);
      toast.success("Full agreement text copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadTxt = () => {
    if (printRef.current) {
      const element = document.createElement("a");
      const file = new Blob([printRef.current.innerText], { type: "text/plain;charset=utf-8" });
      element.href = URL.createObjectURL(file);
      element.download = `${agreementNumber}_Rental_Agreement.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("Agreement downloaded as text file.");
    }
  };

  // Formatted date strings
  const formattedStartDate = rentalTerms.startDate
    ? new Date(rentalTerms.startDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "__________";

  const formattedEndDate = rentalTerms.endDate
    ? new Date(rentalTerms.endDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "__________";

  const fullPropertyAddress = [
    propertyDetails.unitNumber ? `Unit/Flat No. ${propertyDetails.unitNumber}` : "",
    propertyDetails.buildingName,
    propertyDetails.streetAddress,
    propertyDetails.locality,
    propertyDetails.city,
    `${propertyDetails.state} - ${propertyDetails.pincode}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden during print) */}
      {!isPrintOnly && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-foreground">{agreementNumber}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Standard{" "}
                {agreementType === "commercial" ? "Commercial Lease" : "Residential Tenancy"}{" "}
                Agreement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition active:scale-95"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Copied" : "Copy Text"}</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Text</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:brightness-105 transition shadow-xs active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Legal Document Sheet */}
      <div
        ref={printRef}
        className="relative bg-white text-slate-900 font-serif p-8 sm:p-14 rounded-2xl border border-border/80 shadow-lg max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:text-black leading-relaxed"
      >
        {/* Draft Watermark for Unsigned/Draft status */}
        {isDraft && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none">
            <span className="text-7xl sm:text-9xl font-black text-slate-950 transform -rotate-45">
              DRAFT COPY
            </span>
          </div>
        )}

        {/* Document Header */}
        <div className="text-center pb-8 border-b-2 border-slate-900/40 space-y-2">
          <p className="text-[11px] font-sans tracking-widest uppercase font-bold text-slate-500">
            Government of India • Non-Judicial E-Stamp Reference
          </p>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider font-serif">
            {agreementType === "commercial"
              ? "COMMERCIAL LEASE & LICENCE AGREEMENT"
              : "RESIDENTIAL RENT & LEASE AGREEMENT"}
          </h1>
          <p className="text-xs font-sans text-slate-600">
            Agreement Reference No: <span className="font-mono font-bold">{agreementNumber}</span>
          </p>
        </div>

        {/* Execution Date & Place */}
        <div className="mt-6 text-sm text-justify space-y-4">
          <p>
            This <strong>RENTAL AGREEMENT</strong> is made and executed on this{" "}
            <strong>{formattedStartDate}</strong> at{" "}
            <strong>{propertyDetails.city || "Hyderabad"}</strong>, by and between:
          </p>

          {/* First Party (Landlord) */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 font-sans text-xs">
            <p className="font-bold text-slate-900 text-sm">
              1. {ownerDetails.fullName || "[LANDLORD FULL NAME]"}
            </p>
            <p className="text-slate-700">
              Residing at: {ownerDetails.currentAddress || "[Current Residential Address]"},{" "}
              {ownerDetails.city}, {ownerDetails.state} - {ownerDetails.pincode}
            </p>
            <p className="text-slate-600">
              Contact: {ownerDetails.phone || "[Phone Number]"} | Email:{" "}
              {ownerDetails.email || "[Email Address]"}
            </p>
            <p className="font-serif italic text-slate-500 pt-1">
              (Hereinafter jointly and severally referred to as the{" "}
              <strong>"LESSOR / LANDLORD / FIRST PARTY"</strong>, which expression shall unless
              excluded by or repugnant to the context include their legal heirs, executors, and
              administrators).
            </p>
          </div>

          <p className="text-center font-bold font-sans text-xs uppercase tracking-widest text-slate-500">
            — AND —
          </p>

          {/* Second Party (Tenant / Tenants) */}
          <div className="space-y-3">
            {tenants.map((t, idx) => (
              <div
                key={t.id || idx}
                className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 font-sans text-xs"
              >
                <p className="font-bold text-slate-900 text-sm">
                  {idx + 1}. {t.fullName || "[TENANT FULL NAME]"}
                </p>
                <p className="text-slate-700">
                  Residing at: {t.currentAddress || "[Current Address]"}, {t.city}, {t.state} -{" "}
                  {t.pincode}
                </p>
                <p className="text-slate-600">
                  Contact: {t.phone || "[Phone Number]"} | Email: {t.email || "[Email Address]"}
                </p>
                {idx === tenants.length - 1 && (
                  <p className="font-serif italic text-slate-500 pt-1">
                    (Hereinafter referred to as the{" "}
                    <strong>"LESSEE / TENANT / SECOND PARTY"</strong>, which expression shall unless
                    excluded by or repugnant to the context include their legal successors and
                    permitted assigns).
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Recitals / Schedule of Premises */}
          <div className="mt-6 space-y-3">
            <h3 className="font-bold text-sm font-sans uppercase tracking-wider text-slate-900 border-b pb-1">
              I. SCHEDULE OF THE DEMISED PREMISES
            </h3>
            <p>
              WHEREAS the FIRST PARTY is the absolute and lawful owner / authorized holder of the
              premises situated at:
            </p>
            <p className="p-3 bg-slate-100 rounded border border-slate-300 font-sans font-medium text-xs">
              {fullPropertyAddress ||
                "[Detailed Property Address with Unit, Locality, City, State & PIN Code]"}
            </p>
            {propertyDetails.fittingsAndFixtures && (
              <p className="text-xs text-slate-700 font-sans">
                <strong>Fittings &amp; Fixtures provided:</strong>{" "}
                {propertyDetails.fittingsAndFixtures}
              </p>
            )}
            <p>
              AND WHEREAS the SECOND PARTY has approached the FIRST PARTY to take the said scheduled
              premises on rent for{" "}
              <strong>
                {agreementType === "commercial"
                  ? "commercial operations"
                  : "bona fide residential purposes"}
              </strong>
              , and the FIRST PARTY has agreed to let out the same on the following mutually agreed
              covenants:
            </p>
          </div>

          {/* Commercial Terms Summary Table */}
          <div className="mt-6 space-y-3">
            <h3 className="font-bold text-sm font-sans uppercase tracking-wider text-slate-900 border-b pb-1">
              II. SUMMARY OF KEY COMMERCIAL TERMS
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans border-collapse border border-slate-300">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-bold bg-slate-100 w-1/3 border-r border-slate-300">
                      Monthly Rent
                    </td>
                    <td className="p-2.5 font-semibold text-slate-900">
                      ₹{rentalTerms.monthlyRent?.toLocaleString("en-IN") || "0"} per English
                      calendar month
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300">
                      Security Deposit
                    </td>
                    <td className="p-2.5 font-semibold text-slate-900">
                      ₹{rentalTerms.securityDeposit?.toLocaleString("en-IN") || "0"} (Interest-free,
                      Refundable)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300">
                      Tenancy Tenure
                    </td>
                    <td className="p-2.5 text-slate-900">
                      {rentalTerms.durationMonths || 11} Months (From {formattedStartDate} to{" "}
                      {formattedEndDate})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300">
                      Notice Period
                    </td>
                    <td className="p-2.5 text-slate-900">
                      {rentalTerms.noticePeriodMonths || 1} Month(s) written notice
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300">
                      Lock-in Period
                    </td>
                    <td className="p-2.5 text-slate-900">
                      {rentalTerms.lockInPeriodMonths
                        ? `${rentalTerms.lockInPeriodMonths} Month(s)`
                        : "None"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300">
                      Rent Payment Due Date
                    </td>
                    <td className="p-2.5 text-slate-900">
                      On or before the {rentalTerms.paymentDueDay || 5}th of each calendar month
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300">
                      Maintenance &amp; Utilities
                    </td>
                    <td className="p-2.5 text-slate-900">
                      Maintenance: Borne by{" "}
                      <strong>{rentalTerms.maintenanceResponsibility?.toUpperCase()}</strong> |
                      Utilities: Borne by{" "}
                      <strong>{rentalTerms.utilityResponsibility?.toUpperCase()}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold bg-slate-100 border-r border-slate-300">
                      Renewal Escalation
                    </td>
                    <td className="p-2.5 text-slate-900">
                      {rentalTerms.rentEscalationPercent
                        ? `${rentalTerms.rentEscalationPercent}% escalation after ${rentalTerms.rentEscalationPeriodMonths} months`
                        : "Mutually agreed upon renewal"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Numbered Legal Covenants */}
          <div className="mt-8 space-y-4">
            <h3 className="font-bold text-sm font-sans uppercase tracking-wider text-slate-900 border-b pb-1">
              III. TERMS, COVENANTS &amp; CONDITIONS
            </h3>

            <ol className="list-decimal pl-5 space-y-3 text-justify text-xs leading-relaxed">
              {STANDARD_CLAUSES.filter((c) => clauses[c.id]).map((clause) => (
                <li key={clause.id} className="pl-1">
                  <strong>{clause.title}:</strong>{" "}
                  {clause.templateText({
                    monthlyRent: rentalTerms.monthlyRent || 0,
                    securityDeposit: rentalTerms.securityDeposit || 0,
                    noticePeriodMonths: rentalTerms.noticePeriodMonths || 1,
                    lockInPeriodMonths: rentalTerms.lockInPeriodMonths || 0,
                    rentEscalationPercent: rentalTerms.rentEscalationPercent || 0,
                    rentEscalationPeriodMonths: rentalTerms.rentEscalationPeriodMonths || 11,
                    paymentDueDay: rentalTerms.paymentDueDay || 5,
                    maintenanceResponsibility: rentalTerms.maintenanceResponsibility || "tenant",
                    utilityResponsibility: rentalTerms.utilityResponsibility || "tenant",
                  })}
                </li>
              ))}

              {/* Custom Mutually Agreed Terms */}
              {customTerms && customTerms.length > 0 && (
                <>
                  {customTerms.map((term, idx) => (
                    <li key={`custom-${idx}`} className="pl-1">
                      <strong>Special Mutual Covenant {idx + 1}:</strong> {term}
                    </li>
                  ))}
                </>
              )}
            </ol>
          </div>

          {/* Signatures & Execution Section */}
          <div className="mt-12 pt-8 border-t-2 border-slate-900/40 space-y-8">
            <p className="text-xs italic font-serif">
              IN WITNESS WHEREOF, the FIRST PARTY (Lessor) and the SECOND PARTY (Lessee) have set
              their respective hands and digital signatures unto this Agreement on the day, month,
              and year first written above in the presence of the following witnesses:
            </p>

            <div className="grid grid-cols-2 gap-8 pt-4 font-sans text-xs">
              {/* Landlord Signature Block */}
              <div className="p-4 border border-slate-300 rounded-lg space-y-6">
                <div className="border-b border-dashed border-slate-400 pb-8 text-center text-slate-400">
                  {status === "COMPLETED" ? (
                    <div className="text-emerald-700 font-bold flex flex-col items-center">
                      <ShieldCheck className="h-6 w-6 mb-1 text-emerald-600" />
                      <span>Digitally Confirmed</span>
                    </div>
                  ) : (
                    <span>[Signature of Landlord / First Party]</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">{ownerDetails.fullName || "Landlord"}</p>
                  <p className="text-slate-600 text-[11px]">LESSOR / FIRST PARTY</p>
                </div>
              </div>

              {/* Tenant Signature Block */}
              <div className="p-4 border border-slate-300 rounded-lg space-y-6">
                <div className="border-b border-dashed border-slate-400 pb-8 text-center text-slate-400">
                  {status === "COMPLETED" ? (
                    <div className="text-emerald-700 font-bold flex flex-col items-center">
                      <ShieldCheck className="h-6 w-6 mb-1 text-emerald-600" />
                      <span>Digitally Confirmed</span>
                    </div>
                  ) : (
                    <span>[Signature of Tenant(s) / Second Party]</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">
                    {tenants
                      .map((t) => t.fullName)
                      .filter(Boolean)
                      .join(", ") || "Tenant(s)"}
                  </p>
                  <p className="text-slate-600 text-[11px]">LESSEE / SECOND PARTY</p>
                </div>
              </div>
            </div>

            {/* Witnesses */}
            <div className="pt-4 grid grid-cols-2 gap-8 font-sans text-xs">
              <div className="border-t border-slate-300 pt-3 space-y-1">
                <p className="font-bold text-slate-700">Witness 1:</p>
                <p className="text-slate-500">Name: ____________________</p>
                <p className="text-slate-500">Signature: _________________</p>
              </div>
              <div className="border-t border-slate-300 pt-3 space-y-1">
                <p className="font-bold text-slate-700">Witness 2:</p>
                <p className="text-slate-500">Name: ____________________</p>
                <p className="text-slate-500">Signature: _________________</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
