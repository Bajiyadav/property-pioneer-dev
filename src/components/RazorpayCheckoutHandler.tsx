import { useEffect } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { confirmPlanPayment } from "@/modules/billing/services/billingFunctions";

/*
 * Minimal shape of the Razorpay checkout SDK.
 *
 * Typed rather than `any` because this is the code path that takes money: the
 * fields below are the ones we actually pass and read, so a rename in the SDK or
 * a typo in an option name becomes a compile error instead of a checkout that
 * silently opens with the wrong amount.
 */
interface RazorpayFailureResponse {
  error: { description?: string; code?: string; reason?: string };
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  config?: {
    display?: {
      // Razorpay's custom payment-method blocks. Typed to the fields the docs
      // define rather than `Record<string, any>`: this object decides which
      // payment methods a customer is shown, so a typo silently offering the
      // wrong set is a real failure mode, not a style question.
      blocks?: Record<
        string,
        {
          name: string;
          instruments?: Array<{
            method: string;
            issuers?: string[];
            banks?: string[];
            wallets?: string[];
            flows?: string[];
          }>;
        }
      >;
      sequence?: string[];
      preferences?: { show_default_blocks?: boolean };
    };
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export function RazorpayCheckoutHandler() {
  const confirmPayment = useServerFn(confirmPlanPayment);

  useEffect(() => {
    const handleOpenRazorpay = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const order = customEvent.detail;

      if (!order || order.status !== "ok") {
        toast.error("Invalid order details");
        return;
      }

      // Load Razorpay script dynamically if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const options = {
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Seedha Properties",
        description: "Premium Service Upgrade",
        order_id: order.orderId,
        theme: { color: "#059669" },
        prefill: {
          email: order.userEmail || undefined,
          contact: order.userPhone || undefined,
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI",
                instruments: [{ method: "upi" }],
              },
              cards: {
                name: "Pay via Cards",
                instruments: [{ method: "card" }],
              },
              other: {
                name: "Other Payment Modes",
                instruments: [{ method: "netbanking" }, { method: "wallet" }],
              },
            },
            sequence: ["block.upi", "block.cards", "block.other"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        handler: async function (response: RazorpaySuccessResponse) {
          toast.loading("Verifying payment...", { id: "payment-verify" });
          try {
            const result = await confirmPayment({
              data: {
                planId: order.planId,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });
            if (result.verified) {
              toast.success("Payment successful!", { id: "payment-verify" });
              // Dispatch success event so local UI can update
              window.dispatchEvent(
                new CustomEvent("sp:payment-success", { detail: { planId: order.planId } }),
              );
            } else {
              toast.error(result.details || "Payment verification failed", {
                id: "payment-verify",
              });
            }
          } catch (error) {
            toast.error("An error occurred during verification", { id: "payment-verify" });
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: RazorpayFailureResponse) {
        toast.error(`Payment failed: ${response.error.description ?? "please try again"}`);
      });
      rzp.open();
    };

    window.addEventListener("sp:open-razorpay", handleOpenRazorpay);
    return () => {
      window.removeEventListener("sp:open-razorpay", handleOpenRazorpay);
    };
  }, [confirmPayment]);

  return null;
}
