import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Home,
  Phone,
  CheckCircle2,
  Eye,
  Calculator,
  UploadCloud,
  Megaphone,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/list-property")({
  component: ListPropertyLandingPage,
});

function ListPropertyLandingPage() {
  const navigate = useNavigate();
  const [propertyType, setPropertyType] = useState<"Residential" | "Commercial">("Residential");
  const [intent, setIntent] = useState<"Rent" | "Sell" | "PG/Co-living">("Rent");
  const [phone, setPhone] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/list-property/wizard",
      search: { propertyType, intent, phone },
    });
  };

  const faqs = [
    {
      q: "How to post a property on Property Pioneer?",
      a: "You can simply select your property type above, enter your phone number, and follow our 6-step listing wizard to add your details, pricing, and photos.",
    },
    {
      q: "Can I post a property for free?",
      a: "Yes, posting a property as an owner is completely free. We also offer premium packages for higher visibility.",
    },
    {
      q: "What type of property can I post for selling/renting?",
      a: "You can post residential properties (apartments, villas, independent houses) and commercial properties (offices, shops, co-working spaces).",
    },
    {
      q: "What are the benefits of posting a property with us?",
      a: "You get access to thousands of verified buyers and tenants, maximum visibility across the platform, and tools like our price calculator to help you get the best deal.",
    },
    {
      q: "When do I start getting enquiries on my property?",
      a: "Most listings start receiving enquiries within 2-4 hours of approval by our moderation team.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-primary/5 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-display)] mb-6">
              Sell or rent your property faster with{" "}
              <span className="text-primary">Property Pioneer</span>
            </h1>
            <ul className="space-y-4 text-lg text-muted-foreground mb-8">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 h-6 w-6" /> Post property for free
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 h-6 w-6" /> Get verified buyers
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 h-6 w-6" /> Get personalised assistance on
                selling faster
              </li>
            </ul>
          </div>

          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl">
              <div className="flex border-b border-border/50">
                <button className="flex-1 py-4 text-center font-bold text-primary border-b-2 border-primary bg-primary/5">
                  Owner
                </button>
                <button className="flex-1 py-4 text-center font-medium text-muted-foreground hover:bg-secondary/50">
                  Broker/Builder
                </button>
              </div>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-foreground mb-3 block">
                      Property Type
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPropertyType("Residential")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border ${propertyType === "Residential" ? "bg-primary/10 border-primary text-primary font-bold" : "bg-background border-border text-muted-foreground hover:border-border/80"}`}
                      >
                        <Home className="h-4 w-4" /> Residential
                      </button>
                      <button
                        type="button"
                        onClick={() => setPropertyType("Commercial")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border ${propertyType === "Commercial" ? "bg-primary/10 border-primary text-primary font-bold" : "bg-background border-border text-muted-foreground hover:border-border/80"}`}
                      >
                        <Building2 className="h-4 w-4" /> Commercial
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-foreground mb-3 block">
                      You're looking to...
                    </label>
                    <div className="flex gap-2">
                      {["Rent", "Sell", "PG/Co-living"].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setIntent(i as "Rent" | "Sell" | "PG/Co-living")}
                          className={`flex-1 py-2 rounded-full border text-xs sm:text-sm transition-all ${intent === i ? "bg-primary border-primary text-primary-foreground font-bold shadow-md" : "bg-background border-border text-foreground hover:bg-secondary"}`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-foreground mb-3 block">
                      Mobile number
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center bg-secondary px-4 rounded-xl border border-border font-medium text-foreground">
                        +91
                      </div>
                      <Input
                        type="tel"
                        placeholder="Enter your mobile number"
                        className="h-12 rounded-xl text-lg"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                  >
                    Start Now
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center mb-12">
            Loved by thousands of property owners
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-secondary/30 border-border/50">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      AK
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-lg">Anil Kumar</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Owner • 2 BHK, Delhi <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </p>
                  </div>
                </div>
                <p className="italic text-muted-foreground mb-4">
                  "The team at Property Pioneer was a huge help in getting my property rented out.
                  The relationship manager was assigned immediately and guided me through the entire
                  process."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-border/50">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      UP
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-lg">Utkarsh Pratap Singh</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Owner • 3 BHK, Pune <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </p>
                  </div>
                </div>
                <p className="italic text-muted-foreground mb-4">
                  "I recently listed my 3BHK apartment using the premium package, and the experience
                  was nothing short of exceptional. We got serious buyers very quickly."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-display)] mb-4">
              Why should you list with us?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join India's fastest growing property network to find the right buyers and tenants for
              your home.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Eye className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">17 Lacs+ seekers</h3>
              <p className="text-muted-foreground">
                We bring serious buyers & tenants directly to you.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Megaphone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Maximum visibility</h3>
              <p className="text-muted-foreground">
                Showcase your property to thousands of seekers every single day.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Calculator className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Price calculator</h3>
              <p className="text-muted-foreground">
                Get estimated market price of your property, making it easy to sell or rent.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-display)] mb-4">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground">Upload your property in 3 quick steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-border -z-10"></div>

            <div className="relative text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl font-bold shadow-lg">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Upload your property</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us basic details about your property, add pricing & upload photos.
                </p>
              </div>
            </div>

            <div className="relative text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl font-bold shadow-lg">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Property reaches seekers</h3>
                <p className="text-sm text-muted-foreground">
                  Your property will reach maximum buyers/tenants online through our network.
                </p>
              </div>
            </div>

            <div className="relative text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl font-bold shadow-lg">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Start getting enquiries</h3>
                <p className="text-sm text-muted-foreground">
                  You will start getting enquiries from interested buyers as soon as it goes live.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-extrabold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-border rounded-xl bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-lg hover:bg-secondary/50 transition-colors"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                >
                  {faq.q}
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${activeFaq === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="p-5 pt-0 text-muted-foreground leading-relaxed border-t border-border">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
