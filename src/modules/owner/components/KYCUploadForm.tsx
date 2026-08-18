import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
} from "lucide-react";
import {
  type KYCDocument,
  uploadKYCDocument,
  getMyKYCStatus,
} from "@/modules/owner/services/kycService";
import { toast } from "sonner";

export const KYCUploadForm: React.FC = () => {
  const [selectedType, setSelectedType] = useState("aadhar");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [kycDocs, setKycDocs] = useState<KYCDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = async () => {
    setIsLoading(true);
    const docs = await getMyKYCStatus();
    setKycDocs(docs);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a document to upload");
      return;
    }

    setIsUploading(true);
    const res = await uploadKYCDocument(selectedFile, selectedType);
    setIsUploading(false);

    if (res.success) {
      toast.success("Document uploaded successfully for review!", {
        description: "Our compliance team will verify your document within 2-4 hours.",
      });
      setSelectedFile(null);
      void loadDocuments();
    } else {
      toast.error(res.error || "Failed to upload document");
    }
  };

  const isAnyApproved = kycDocs.some((d) => d.status === "approved");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="h-4 w-4" />
            <span>Owner Trust Certification</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Get Your Gold "Verified Owner" Badge
          </h2>
          <p className="mt-2 text-teal-100 text-sm sm:text-base max-w-xl">
            Properties listed by verified owners receive 3.5x more genuine tenant inquiries, instant
            buyer trust, and priority placement in search.
          </p>
        </div>
      </div>

      {/* Verification Status Alert */}
      {isAnyApproved ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold text-sm">Your Account is Verified!</div>
            <div className="text-xs text-emerald-700">
              All your active property listings now proudly display the Gold Verified Owner badge.
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-900">
          <Clock className="h-6 w-6 text-amber-600 shrink-0" />
          <div>
            <div className="font-bold text-sm">Verification Pending</div>
            <div className="text-xs text-amber-700">
              Upload your government ID or electricity bill below to activate your verified trust
              badge.
            </div>
          </div>
        </div>
      )}

      {/* Upload Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-800">Upload Verification Document</h3>

        <form onSubmit={handleUpload} className="space-y-5">
          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Select Document Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "aadhar", label: "Aadhaar Card" },
                { id: "pan", label: "PAN Card" },
                { id: "electricity_bill", label: "Electricity Bill" },
                { id: "property_tax", label: "Property Tax" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                    selectedType === t.id
                      ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drag and Drop / File Input Box */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Attach File (JPG, PNG, PDF &lt; 5MB)
            </label>
            <div className="border-2 border-dashed border-teal-200 hover:border-teal-500 rounded-2xl p-6 text-center bg-teal-50/30 transition-colors">
              <input
                type="file"
                id="kyc-file"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
              />
              <label
                htmlFor="kyc-file"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="h-12 w-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : "Click to browse or drop document here"}
                </div>
                <div className="text-xs text-slate-500">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Encrypted securely in Supabase Private Storage"}
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
            <Lock className="h-4 w-4 text-teal-600 shrink-0" />
            <span>
              Your personal documents are strictly encrypted and used only for owner verification.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading & Encrypting...</span>
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4" />
                <span>Submit for Verification</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Uploaded History List */}
      {kycDocs.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800">Submitted Documents</h3>
          <div className="divide-y divide-slate-100">
            {kycDocs.map((doc) => (
              <div key={doc.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-800 uppercase">
                    {doc.document_type.replace("_", " ")}
                  </div>
                  <div className="text-xs text-slate-400">
                    Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  {doc.status === "approved" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" /> Approved
                    </span>
                  ) : doc.status === "rejected" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      <AlertCircle className="h-3 w-3" /> Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      <Clock className="h-3 w-3" /> Under Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
