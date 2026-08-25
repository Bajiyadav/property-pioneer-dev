import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { EnterprisePasswordForm } from "../../src/modules/authentication/components/EnterprisePasswordForm";
import { supabase } from "../../src/integrations/supabase/client";
import { toast } from "sonner";

// Mock Supabase
vi.mock("../../src/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      verifyOtp: vi.fn(),
      resend: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          then: (cb: any) => cb({ data: [], error: null }),
        })),
      })),
    })),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Signup Authentication Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillSignupForm = () => {
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Suresh Kumar/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText(/you@domain.com/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/Mobile Number/i), { target: { value: "9876543210" } });
    const passwordInputs = screen.getAllByPlaceholderText(/Min 6 characters/i);
    fireEvent.change(passwordInputs[0], { target: { value: "SecurePass123!" } });
  };

  it("signup waits for email verification and OTP screen appears", async () => {
    // Mock signUp to return success with NO session (meaning email confirmation required)
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: { id: "123", identities: [{ id: "1" }] }, session: null },
      error: null,
    } as any);

    render(<EnterprisePasswordForm mode="signup" onSuccess={vi.fn()} />);

    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
        email: "test@example.com",
        password: "SecurePass123!",
      }));
    });

    // Verify OTP screen appears
    expect(await screen.findByText(/Enter 6-Digit OTP Code/i)).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("check your email"));
  });

  it("handles duplicate email during signup", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: { id: "123", identities: [] }, session: null }, // empty identities indicates duplicate in Supabase
      error: null,
    } as any);

    render(<EnterprisePasswordForm mode="signup" onSuccess={vi.fn()} />);

    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("already exists"));
    });
  });

  it("handles signup failure", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Signup failed" } as any,
    });

    render(<EnterprisePasswordForm mode="signup" onSuccess={vi.fn()} />);

    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("signup failed");
    });
  });

  it("successful OTP verification", async () => {
    // 1. Trigger signup to get to OTP screen
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: { id: "123", identities: [{ id: "1" }] }, session: null },
      error: null,
    } as any);

    const onSuccessMock = vi.fn();
    render(<EnterprisePasswordForm mode="signup" onSuccess={onSuccessMock} />);

    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await screen.findByText(/Enter 6-Digit OTP Code/i);

    // 2. Enter OTP and verify
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { user: { id: "123" }, session: { access_token: "token" } },
      error: null,
    } as any);

    fireEvent.change(screen.getByPlaceholderText(/123456/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP & Activate Account/i }));

    await waitFor(() => {
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        token: "123456",
        type: "signup",
      });
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Account activated"));
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  it("invalid OTP / expired OTP", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: { id: "123", identities: [{ id: "1" }] }, session: null },
      error: null,
    } as any);

    render(<EnterprisePasswordForm mode="signup" onSuccess={vi.fn()} />);

    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await screen.findByText(/Enter 6-Digit OTP Code/i);

    // Enter wrong OTP
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Token has expired or is invalid" } as any,
    });

    fireEvent.change(screen.getByPlaceholderText(/123456/i), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP & Activate Account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Token has expired or is invalid");
    });
  });

  it("resend OTP", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: { id: "123", identities: [{ id: "1" }] }, session: null },
      error: null,
    } as any);

    render(<EnterprisePasswordForm mode="signup" onSuccess={vi.fn()} />);

    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await screen.findByText(/Enter 6-Digit OTP Code/i);

    // Resend OTP
    vi.mocked(supabase.auth.resend).mockResolvedValueOnce({
      data: {},
      error: null,
    } as any);

    fireEvent.click(screen.getByText(/Resend OTP Code/i));

    await waitFor(() => {
      expect(supabase.auth.resend).toHaveBeenCalledWith(expect.objectContaining({
        type: "signup",
        email: "test@example.com",
      }));
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Confirmation email sent"));
    });
  });
});
