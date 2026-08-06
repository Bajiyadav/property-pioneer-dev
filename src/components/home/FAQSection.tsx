import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "How does Urban Properties guarantee zero brokerage?",
    a: "We connect tenants directly with verified property owners via 1-tap WhatsApp and secure in-app messaging. There are no agent commissions or hidden fees involved.",
  },
  {
    q: "How are owners and properties verified in Hyderabad?",
    a: "Every owner identity is verified via phone, email, and Aadhaar check. Properties undergo physical address location checks to ensure 100% genuine listings.",
  },
  {
    q: "Can I generate a digital rental agreement online?",
    a: "Yes! Urban Properties provides instant digital rental agreement generation with e-stamping and doorstep delivery within 10 minutes.",
  },
  {
    q: "Which areas in Hyderabad have active rental listings?",
    a: "We have active verified rental flats and PGs in Gachibowli, Madhapur, Kondapur, Hitech City, Miyapur, Kukatpally, Financial District, Banjara Hills, and Jubilee Hills.",
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
        <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Frequently Asked Questions</h2>
        <p className="mt-1 text-sm text-muted-foreground">Everything you need to know about renting & listing on Urban Properties.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="rounded-2xl border border-border bg-card overflow-hidden shadow-[var(--shadow-card)]">
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-foreground text-sm sm:text-base hover:bg-secondary/50 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180 text-primary" : ""}`} />
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
