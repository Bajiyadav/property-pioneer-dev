import { useState } from "react";
import { MessageSquare, Heart, Star, Send, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

export function FeedbackSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [feedbackType, setFeedbackType] = useState<"what_works" | "what_to_improve">("what_works");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please enter your feedback before submitting.");
      return;
    }
    setSubmitted(true);
    toast.success("Thank you for your valuable feedback!");
  };

  const handleReset = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setComment("");
      setRating(5);
    }, 300);
  };

  return (
    <>
      {/* Editorial Feedback Banner (Inspired by Studio Shodwe Template) */}
      <section className="bg-gradient-to-b from-secondary/40 via-background to-secondary/30 py-16 sm:py-20 border-t border-border/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary mb-3">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Community Voice</span>
          </div>

          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-foreground sm:text-5xl tracking-tight">
            We value <span className="italic font-normal">your feedback</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            If you&apos;ve got a few minutes, your honest take would genuinely help us improve. We
            want the honest version: what felt right, what didn&apos;t, and what you&apos;d change.
          </p>

          <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#4A5844] hover:bg-[#3d4938] text-white px-7 py-3.5 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>Give Feedback</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Feedback & Thank You Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card border border-border/80 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={handleReset}
              className="absolute top-4 right-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {!submitted ? (
              <div className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    SEEDHA Properties Feedback
                  </span>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground mt-1">
                    Tell us what&apos;s working{" "}
                    <span className="italic font-normal">and what isn&apos;t</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your direct inputs shape our features and 0% brokerage marketplace.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Rating Stars */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-2 text-center">
                      How has your experience been so far?
                    </label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-2xl transition-transform hover:scale-125 active:scale-95"
                        >
                          <Star
                            className={`h-7 w-7 ${
                              star <= rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-border stroke-1"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Type Tabs */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackType("what_works")}
                      className={`rounded-xl py-2 text-xs font-bold border transition-all ${
                        feedbackType === "what_works"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                          : "bg-background border-border text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      ✨ What Worked Well
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackType("what_to_improve")}
                      className={`rounded-xl py-2 text-xs font-bold border transition-all ${
                        feedbackType === "what_to_improve"
                          ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400"
                          : "bg-background border-border text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      💡 What We Should Change
                    </button>
                  </div>

                  {/* Textarea */}
                  <div>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        feedbackType === "what_works"
                          ? "What features or direct owner connections did you like most?"
                          : "What felt confusing, slow, or missing that we can improve?"
                      }
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary/95 text-white py-3.5 text-xs font-bold shadow-md transition-all active:scale-98"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit Honest Feedback</span>
                  </button>
                </form>
              </div>
            ) : (
              /* Thank You Modal Body (Inspired by the Thank You Template) */
              <div className="relative overflow-hidden p-8 sm:p-12 text-center bg-gradient-to-br from-orange-500 via-rose-500 to-amber-500 text-white">
                <div className="relative z-10">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/20 border border-white/30 mb-4 backdrop-blur-sm">
                    <Heart className="h-8 w-8 text-white fill-white" />
                  </div>

                  <h3 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-extrabold tracking-tight">
                    THANK YOU!
                  </h3>

                  <p className="mt-3 text-sm sm:text-base text-white/95 leading-relaxed max-w-sm mx-auto">
                    Every success begins with support like yours. Thank you for believing in our 0%
                    brokerage mission.
                  </p>

                  <p className="mt-2 text-xs text-white/80 font-mono">@seedhaproperties</p>

                  <div className="mt-8">
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 rounded-full bg-white text-stone-900 hover:bg-white/90 px-8 py-3 text-xs font-bold shadow-lg transition-all active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Back to Browsing</span>
                    </button>
                  </div>
                </div>

                {/* Decorative Wave lines */}
                <div className="absolute -bottom-10 inset-x-0 opacity-20 pointer-events-none">
                  <svg viewBox="0 0 1440 320" className="w-full h-32 fill-white">
                    <path d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,138.7C672,139,768,181,864,197.3C960,213,1056,203,1152,181.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
