import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Does Urban Properties charge brokerage?",
    a: "Urban Properties adds no commission to a listing and never charges you to enquire — you contact the owner directly. We cannot control what an individual owner or third party may charge, so always confirm costs before you commit.",
  },
  {
    q: "How are listings reviewed?",
    a: "Every listing is submitted to admin moderation and stays private until a moderator approves it. We review the owner and property information supplied at submission. We do not verify Aadhaar, PAN, title deeds or government records, and no listing should be read as carrying that assurance.",
  },
  {
    q: "How do I contact a property owner?",
    a: "Open any listing and send an enquiry. It goes straight to the owner's dashboard along with the phone number you provide, and they contact you directly.",
  },
  {
    q: "Which areas in Hyderabad have active rental listings?",
    a: "Hyderabad is our live market, with listings concentrated in Gachibowli, Madhapur, Kondapur, Hitech City, Miyapur, Financial District, Jubilee Hills, Kokapet and Raidurg. Search shows exactly what is available in each area.",
  },
  {
    q: "How can property owners list their homes for free?",
    a: "Owners simply click 'List Property FREE', upload property photos, address details, and rent price in under 2 minutes to start receiving direct tenant inquiries.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <HelpCircle className="h-3.5 w-3.5" /> Support Center
        </span>
        <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
          Frequently Asked Questions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need to know about renting & listing on Urban Properties.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-[var(--shadow-card)]"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-foreground text-sm sm:text-base hover:bg-secondary/50 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180 text-primary" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
