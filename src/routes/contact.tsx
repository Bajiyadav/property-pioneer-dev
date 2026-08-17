import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { logLiveActivity } from "@/lib/leadRouting";
import { APP_NAME } from "@/config/app";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: `Contact Us — ${APP_NAME}` },
      {
        name: "description",
        content: `Get in touch with ${APP_NAME} customer support, real estate team, or territory area agents in Hyderabad. Phone: +91 98765 43210.`,
      },
    ],
  }),
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locality, setLocality] = useState("Kukatpally");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error("Please fill in your Name, Mobile Number, and Message.");
      return;
    }

    setSubmitting(true);
    try {
      // Log lead to live_activities and dispatch to Admin & Agent dashboards
      await logLiveActivity({
        activity_type: "inquiry",
        locality,
        contact_name: name,
        contact_phone: phone,
        search_query: `Direct Contact Inquiry: ${message.slice(0, 80)}`,
      });

      setSubmitted(true);
      toast.success("Inquiry sent successfully! A territory agent will call you shortly.");
    } catch (err) {
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 space-y-12">
      {/* Header */}
      <section className="pt-10 pb-8 border-b border-border/40 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">
            <MessageSquare className="h-4 w-4" /> We're Here to Help
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">Contact {APP_NAME} Support &amp; Agents</h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Have questions about a property listing, site visit, or zero brokerage services? Reach out to our Hyderabad HQ or local area specialists.
          </p>
        </div>
      </section>

      {/* Main Form & Contact Info */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Hyderabad Corporate HQ
              </h2>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-foreground block text-xs">Office Address</strong>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">
                      Level 4, Cyber Towers, Hitec City, Madhapur, Hyderabad, Telangana 500081
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600/10 text-emerald-600 shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-foreground block text-xs">Helpline Phone</strong>
                    <a href="tel:+919876543210" className="text-primary font-bold hover:underline">
                      +91 98765 43210 / +91 040 4567 8900
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-600/10 text-purple-600 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-foreground block text-xs">Email Support</strong>
                    <a href="mailto:support@urbanproperties.in" className="text-muted-foreground hover:text-foreground">
                      support@urbanproperties.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-600/10 text-amber-600 shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-foreground block text-xs">Working Hours</strong>
                    <p className="text-muted-foreground">Monday – Saturday: 9:00 AM – 8:00 PM IST</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Quick Trigger */}
              <div className="pt-2 border-t border-border/50">
                <a
                  href="https://wa.me/919876543210?text=Hi%2C%20I%20have%20an%20inquiry%20regarding%20a%20property%20listing."
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow hover:bg-emerald-500 transition cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" /> Chat on WhatsApp Now
                </a>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-xl font-extrabold text-foreground">Send an Inquiry</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Fill in your requirements and our local territory agent in your area will contact you.
                </p>
              </div>

              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-600/10 text-emerald-600 mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Inquiry Submitted!</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Thank you, <strong className="text-foreground">{name}</strong>. Our Area Agent for <strong className="text-foreground">{locality}</strong> will call you shortly at <strong className="text-foreground">{phone}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                    }}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Suresh Kumar"
                        className="w-full p-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Mobile Number (+91) *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 98765 43210"
                        className="w-full p-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="suresh@example.com"
                        className="w-full p-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-foreground">Target Locality in Hyderabad</label>
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full p-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="Kukatpally">Kukatpally</option>
                        <option value="Gachibowli">Gachibowli</option>
                        <option value="Madhapur">Madhapur</option>
                        <option value="Hitec City">Hitec City</option>
                        <option value="Kondapur">Kondapur</option>
                        <option value="Jubilee Hills">Jubilee Hills</option>
                        <option value="Banjara Hills">Banjara Hills</option>
                        <option value="Begumpet">Begumpet</option>
                        <option value="Miyapur">Miyapur</option>
                        <option value="Secunderabad">Secunderabad</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Your Message or Property Inquiry *</label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you're looking for (e.g., 2 BHK rent in Kukatpally under ₹30,000)..."
                      rows={4}
                      className="w-full p-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-extrabold text-xs shadow-lg hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Google Map Viewport */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border/80 bg-card p-4 space-y-3 shadow-sm overflow-hidden">
          <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-emerald-500" /> Hitec City, Hyderabad Office Map Location
          </h3>
          <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden bg-muted border border-border/50">
            <iframe
              title="Hyderabad Office Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.312958376916!2d78.3789123!3d17.4475141!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9158f201b205%3A0x11bbe7be7792411b!2sCyber%20Towers!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
