import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { StateView, type UIStateType } from "@/shared/components/feedback/StateView";
import { PropertyCardSkeleton } from "@/shared/components/feedback/PropertyCardSkeleton";

describe("Seedha Production UI State System Suite (Web)", () => {
  describe("1. Empty State", () => {
    it("renders empty state with custom title and action button", () => {
      const html = renderToString(
        React.createElement(StateView, {
          type: "empty",
          title: "No saved properties yet",
          description: "Save properties you like and find them here later.",
          action: {
            label: "Explore Properties",
            href: "/properties",
          },
        }),
      );

      expect(html).toContain("No saved properties yet");
      expect(html).toContain("Save properties you like and find them here later.");
      expect(html).toContain("Explore Properties");
      expect(html).toContain('role="status"');
    });
  });

  describe("2. Loading & Skeleton State", () => {
    it("renders layout-preserving PropertyCardSkeleton with aria-busy", () => {
      const html = renderToString(
        React.createElement(PropertyCardSkeleton, {
          count: 3,
          viewMode: "grid",
        }),
      );

      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain("grid-cols-1");
    });

    it("renders loading StateView with spinner and accessible role", () => {
      const html = renderToString(
        React.createElement(StateView, {
          type: "loading",
          title: "Loading properties...",
        }),
      );

      expect(html).toContain("Loading properties...");
      expect(html).toContain('role="progressbar"');
    });
  });

  describe("3. No Internet & Offline Recovery", () => {
    it("renders offline warning state without destroying layout", () => {
      const html = renderToString(
        React.createElement(StateView, {
          type: "no_internet",
          action: {
            label: "Retry Connection",
          },
        }),
      );

      expect(html).toContain("You&#x27;re offline");
      expect(html).toContain("Check your internet connection and try again.");
      expect(html).toContain("Retry Connection");
      expect(html).toContain('role="alert"');
    });
  });

  describe("4. Slow Network Inline Warning", () => {
    it("renders compact inline banner for slow network requests", () => {
      const html = renderToString(
        React.createElement(StateView, {
          type: "slow_network",
          inline: true,
          action: {
            label: "Retry",
          },
        }),
      );

      expect(html).toContain("Taking longer than usual...");
      expect(html).toContain("Retry");
      expect(html).toContain('role="status"');
    });
  });

  describe("5. No Search Results State", () => {
    it("renders search empty state with applied filter pills and clear action", () => {
      const html = renderToString(
        React.createElement(StateView, {
          type: "no_search_results",
          title: "No properties found",
          filtersSummary: ["2 BHK", "Gachibowli", "₹25,000"],
          action: {
            label: "Clear All Filters",
          },
          secondaryAction: {
            label: "Explore Nearby Areas",
            href: "/properties",
          },
        }),
      );

      expect(html).toContain("No properties found");
      expect(html).toContain("2 BHK");
      expect(html).toContain("Gachibowli");
      expect(html).toContain("₹25,000");
      expect(html).toContain("Clear All Filters");
      expect(html).toContain("Explore Nearby Areas");
    });
  });

  describe("6. Permission Denied & Session Expired", () => {
    it("renders neutral permission denied state without leaking internal roles", () => {
      const html = renderToString(
        React.createElement(StateView, {
          type: "permission_denied",
          action: {
            label: "Go to Homepage",
            href: "/",
          },
        }),
      );

      expect(html).toContain("Access restricted");
      expect(html).toContain("You don&#x27;t have permission to view or manage this resource.");
      expect(html).toContain("Go to Homepage");
    });

    it("renders session expired state with sign in action", () => {
      const html = renderToString(
        React.createElement(StateView, {
          type: "session_expired",
          action: {
            label: "Sign In",
            href: "/auth?redirect=%2Fdashboard",
          },
        }),
      );

      expect(html).toContain("Session expired");
      expect(html).toContain("Sign In");
    });
  });

  describe("7. Server Error & Partial Failure", () => {
    it("renders server error with safe reference code and retry button", () => {
      const html = renderToString(
        React.createElement(StateView, {
          type: "server_error",
          referenceCode: "ERR-1234-AUTH",
          action: {
            label: "Try Again",
          },
        }),
      );

      expect(html).toContain("Something went wrong");
      expect(html).toContain("Ref: ERR-1234-AUTH");
      expect(html).toContain("Try Again");
      expect(html).toContain('role="alert"');
    });

    it("renders partial failure banner for localized section retry", () => {
      const html = renderToString(
        React.createElement(StateView, {
          type: "partial_failure",
          inline: true,
          action: {
            label: "Retry Section",
          },
        }),
      );

      expect(html).toContain("Couldn&#x27;t load this section");
      expect(html).toContain("Retry Section");
    });
  });

  describe("8. Payment & Verification Lifecycles", () => {
    it("renders payment states (pending, success, failed)", () => {
      const pendingHtml = renderToString(
        React.createElement(StateView, { type: "payment_pending" }),
      );
      expect(pendingHtml).toContain("Payment processing...");

      const successHtml = renderToString(
        React.createElement(StateView, { type: "payment_success" }),
      );
      expect(successHtml).toContain("Payment successful ✓");

      const failedHtml = renderToString(React.createElement(StateView, { type: "payment_failed" }));
      expect(failedHtml).toContain("Payment was not completed");
    });

    it("renders email verification states (sent, verified, expired)", () => {
      const sentHtml = renderToString(
        React.createElement(StateView, { type: "email_verification_sent" }),
      );
      expect(sentHtml).toContain("Verification email sent");

      const verifiedHtml = renderToString(
        React.createElement(StateView, { type: "email_verified" }),
      );
      expect(verifiedHtml).toContain("Email verified ✓");

      const expiredHtml = renderToString(
        React.createElement(StateView, { type: "email_verification_expired" }),
      );
      expect(expiredHtml).toContain("Verification link expired");
    });
  });
});
