import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { submitEnquiry } from "@/modules/enquiry/services/enquiryService";
import { TurnstileWidget } from "@/shared/components/TurnstileWidget";
import { CheckCircle2 } from "lucide-react";
import { useInteractionStore } from "@/shared/stores/interactionStore";

export function EnquiryForm({
  propertyId,
  ownerId,
  tenantId,
  onSent,
}: {
  propertyId: string;
  ownerId: string;
  tenantId: string;
  onSent: () => void;
}) {
  const mountedAt = useRef<number>(Date.now());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [token, setToken] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, [propertyId]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (sending) return;
        setSending(true);

        // Simulating the backend call using the interaction store
        useInteractionStore.getState().sendMessage(
          propertyId,
          "Property Enquiry",
          tenantId,
          ownerId,
          tenantId,
          message
        );

        setTimeout(() => {
          setSending(false);
          toast.success("Enquiry sent — the owner will get back to you.");
          onSent();
        }, 600);
      }}
      className="mt-4 grid gap-2"
    >
      {/* Honeypot — hidden from humans, tempting to bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
        placeholder="Your name"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        required
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        maxLength={20}
        placeholder="Phone"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <textarea
        required
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1000}
        placeholder="I'm interested in this home…"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <TurnstileWidget onToken={setToken} className="[&>*]:max-w-full" />
      <button
        type="submit"
        disabled={sending}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
