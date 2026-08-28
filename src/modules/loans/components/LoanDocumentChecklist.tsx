import { useState } from "react";
import {
  FileText,
  UserCheck,
  Briefcase,
  Building,
  Home,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type DocCategory = "kyc" | "salaried" | "self-employed" | "property";

export function LoanDocumentChecklist() {
  const [activeCategory, setActiveCategory] = useState<DocCategory>("kyc");

  const categories = [
    {
      id: "kyc" as DocCategory,
      title: "A. Identity & KYC",
      icon: UserCheck,
      desc: "Mandatory for all primary applicants and co-applicants",
    },
    {
      id: "salaried" as DocCategory,
      title: "B. Salaried Applicants",
      icon: Briefcase,
      desc: "Income verification for regular employed professionals",
    },
    {
      id: "self-employed" as DocCategory,
      title: "C. Self-Employed",
      icon: Building,
      desc: "Business owners, professionals, and proprietors",
    },
    {
      id: "property" as DocCategory,
      title: "D. Property Documents",
      icon: Home,
      desc: "Title, sanction plans, and legal ownership records",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-black text-foreground sm:text-2xl">
              What Documents May You Need?
            </h3>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm mt-1">
            Keep these documents organized to fast-track your home loan technical and legal
            appraisal.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-primary bg-primary/5 text-primary shadow-xs"
                  : "border-border bg-card/60 hover:bg-card text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="text-xs font-bold text-foreground">{cat.title}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{cat.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Category Content */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        {activeCategory === "kyc" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-foreground">Identity & Address KYC Proofs</h4>
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                Mandatory for all applicants
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Under RBI Master Directions, all borrowers and co-borrowers must submit valid
              officially valid documents (OVD):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      PAN Card (Permanent Account Number)
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Mandatory tax identification proof for financial underwriting.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Aadhaar Card (UIDAI)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Masked Aadhaar copy or offline XML for address & identity verification.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Passport / Voter ID / Driving License
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Alternative secondary address proofs if current address differs from Aadhaar.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Passport Size Photographs</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Recent color photographs signed across the face.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === "salaried" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-foreground">
                Salaried Applicants Income Checklist
              </h4>
              <span className="rounded-full bg-blue-500/10 px-3 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                Employed Individuals
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              To verify steady employment and compute repayment capacity:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Latest 3-6 Months Salary Slips
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Official salary slips showing gross pay, deductions, PF, and net take-home
                      salary.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Latest 6 Months Salary Bank Account Statement
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Original e-statement with digital signature verifying salary credit entries.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Form 16 (Part A & B) / Latest 2 Years ITR
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Employer TDS certificate or income tax return acknowledgment.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Proof of Employment / Official ID Card
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Company ID card or appointment letter validating current continuous service.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === "self-employed" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-foreground">
                Self-Employed & Business Applicants
              </h4>
              <span className="rounded-full bg-purple-500/10 px-3 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                Business & Professionals
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              For proprietors, partners, directors, and independent consultants:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Last 2-3 Years Income Tax Returns (ITR)
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Filed ITR along with complete computation of income and tax receipts.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Audited Balance Sheet & P&L Statement
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Financial statements for the previous 2 financial years certified by a
                      Chartered Accountant.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Latest 12 Months Current & Savings Statements
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Bank statements for all operational business accounts and personal accounts.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Business Proof / GSTIN / Certificate of Incorporation
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      GST registration certificate, Shop & Establishment license, or Partnership
                      Deed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === "property" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-foreground">
                Property & Legal Documentation
              </h4>
              <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Asset Verification
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Required for the lender's independent title search and technical property valuation:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Agreement to Sale / Sale Deed Copy
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Executed draft or registered sale agreement specifying property consideration
                      value.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Chain of Title Documents (Past 13-30 Years)
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Prior title deeds, link documents, mutation records, and Encumbrance
                      Certificate (EC).
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Approved Building Sanction Plan & NOC
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Approved layout/floor blueprint from local municipal authority (e.g. GHMC,
                      BBMP) and NOC.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Occupancy / Completion Certificate (OC/CC)
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Mandatory for completed ready-to-move projects to verify compliance with
                      building norms.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Universal Disclaimer */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p>
            <strong className="font-semibold text-foreground">Important Note:</strong> Exact
            documentation varies by lender, applicant profile, income structure, and property type.
            Your lender's legal advocate and technical valuation engineer may request additional
            supporting records.
          </p>
        </div>
      </div>
    </div>
  );
}
