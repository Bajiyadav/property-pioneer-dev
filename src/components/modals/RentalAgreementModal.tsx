import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, CheckCircle2, ShieldCheck, Download, IndianRupee, Printer } from "lucide-react";

export function RentalAgreementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [tenantName, setTenantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [rent, setRent] = useState(25000);
  const [deposit, setDeposit] = useState(50000);
  const [noticeMonths, setNoticeMonths] = useState(1);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !ownerName) return;
    setGenerated(true);
    toast.success("Digital Rental Agreement Drafted!", {
      description: "Telangana e-Stamp legal template initialized.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-card border-border p-6 rounded-3xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Telangana Legal E-Stamp
            </span>
            <span className="text-xs text-muted-foreground">10-Minute Delivery</span>
          </div>
          <DialogTitle className="text-2xl font-semibold text-foreground mt-2 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Digital Rental Agreement Generator
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate legally binding e-stamped rental agreements for Hyderabad properties.
          </DialogDescription>
        </DialogHeader>

        {generated ? (
          <div className="space-y-4">
            {/* Legal Document Preview Box */}
            <div className="rounded-2xl border border-border bg-secondary/40 p-5 text-xs space-y-2 text-foreground font-mono">
              <div className="text-center border-b border-border/60 pb-2 font-semibold font-sans text-sm">
                LEGAL RENTAL AGREEMENT DRAFT
              </div>
              <p><strong>Tenant:</strong> {tenantName}</p>
              <p><strong>Landlord / Owner:</strong> {ownerName}</p>
              <p><strong>Monthly Rent:</strong> ₹{rent.toLocaleString()}/month</p>
              <p><strong>Refundable Security Deposit:</strong> ₹{deposit.toLocaleString()}</p>
              <p><strong>Lock-in Period:</strong> 11 Months</p>
              <p><strong>Notice Period:</strong> {noticeMonths} Month(s)</p>
              <p className="text-[10px] text-muted-foreground pt-2">Includes standard Telangana stamp duty registration terms.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  toast.success("Legal PDF Downloaded!");
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow"
              >
                <Download className="h-4 w-4" /> Download PDF Agreement
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenerated(false);
                  onClose();
                }}
                className="rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-semibold text-foreground"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-foreground">Tenant Name</label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-foreground">Landlord / Owner Name</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. V. Rao"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-foreground">Monthly Rent (₹)</label>
                <input
                  type="number"
                  required
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-foreground">Security Deposit (₹)</label>
                <input
                  type="number"
                  required
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 shadow"
            >
              <FileText className="h-4 w-4" /> Generate Legal Draft Preview
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
