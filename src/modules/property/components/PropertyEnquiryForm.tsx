import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { submitEnquiry } from "@/modules/enquiry/services/enquiryService";
import { TurnstileWidget } from "@/shared/components/TurnstileWidget";
import { CheckCircle2, MessageSquare, Send } from "lucide-react";
import { useInteractionStore } from "@/shared/stores/interactionStore";
import { useAuthSession } from "@/hooks/useAuthSession";

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
  // We already hold the signed-in user's name/phone in their profile — reuse it
  // and NEVER ask for the name again (no duplicate collection).
  const { user } = useAuthSession();
  const knownName =
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user?.user_metadata?.name === "string" && user.user_metadata.name) ||
    "";
  const knownPhone =
    (typeof user?.user_metadata?.phone === "string" && user.user_metadata.phone) || "";

  const mountedAt = useRef<number>(Date.now());
  const [name, setName] = useState(knownName);
  const [phone, setPhone] = useState(knownPhone);
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [token, setToken] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [sentWhatsappUrl, setSentWhatsappUrl] = useState<string | null>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, [propertyId]);

  // The session can resolve after mount — populate name/phone from the profile
  // when it does, so we never present an empty field for data we already hold.
  useEffect(() => {
    if (knownName) setName(knownName);
    if (knownPhone) setPhone(knownPhone);
  }, [knownName, knownPhone]);

  if (sentWhatsappUrl) {
    return (
      <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center animate-in fade-in zoom-in-95">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">Enquiry Sent Successfully!</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          The owner has received an automated alert for your enquiry.
        </p>

        <a
          href={sentWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#20bd5a] hover:shadow"
        >
          <MessageSquare className="h-4 w-4" />
          Chat with Owner on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (sending) return;
        setSending(true);

        const elapsedMs = Math.max(3000, Date.now() - mountedAt.current);

        try {
          const result = await submitEnquiry({
            propertyId,
            name,
            phone,
            message,
            company,
            elapsedMs,
            turnstileToken: token,
          });

          if (result.ok) {
            // Also register in client-side interaction store for immediate timeline update
            useInteractionStore
              .getState()
              .sendMessage(propertyId, "Property Enquiry", tenantId, ownerId, tenantId, message);

            toast.success("Enquiry sent — the owner has been notified!");
            if (result.whatsappUrl) {
              setSentWhatsappUrl(result.whatsappUrl);
            }
            onSent();
          } else {
            toast.error(result.error || "Could not submit enquiry. Please try again.");
          }
        } catch (err) {
          // A failed enquiry must not be simulated as a successful one.
          //
          // This block used to write the enquiry into the client-side
          // interaction store and report "Enquiry submitted successfully!" — its
          // own comment called it a "fallback simulation". The effect was that
          // any network or server error produced a buyer who believed the owner
          // had been contacted AND a fabricated entry in their own timeline
          // confirming it. The owner received nothing. This is the primary
          // conversion action on the platform, so the failure mode was a silent
          // dead end on the one thing the marketplace exists to do.
          //
          // The store write stays on the success path above, where it is a
          // legitimate optimistic update of a result the server confirmed.
          console.error("[enquiry] submission failed:", err);
          toast.error("Could not send your enquiry. Please check your connection and try again.");
        } finally {
          setSending(false);
        }
      }}
      className="mt-4 grid gap-2.5"
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
      {/* We already have the signed-in user's name — show it, never re-ask. */}
      {knownName ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Enquiring as <span className="font-semibold text-foreground">{knownName}</span>
        </p>
      ) : (
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="Your full name"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      )}
      <input
        required
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        maxLength={20}
        placeholder="Phone number (+91)"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <textarea
        required
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1000}
        placeholder="Hi, I am interested in scheduling a walkthrough for this property..."
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
      />
      <TurnstileWidget action="enquiry" onToken={setToken} className="[&>*]:max-w-full" />
      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {sending ? "Sending Alert…" : "Send Enquiry & Alert Owner"}
      </button>
    </form>
  );
}
