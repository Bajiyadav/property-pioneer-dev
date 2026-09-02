import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { sql } from "@/server/db";
import { verifyToken, extractBearerToken } from "@/server/auth";

export const Route = createFileRoute("/api/v2/home-loans")({
  server: {
    handlers: {
      // POST: Submit a home loan inquiry
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const {
            applicantName,
            phone,
            email,
            monthlyIncome,
            loanAmount,
            city,
            employmentType,
            existingEmi = 0,
          } = body;

          if (!applicantName || !phone || !loanAmount) {
            return jsonResponse(
              { ok: false, error: "applicantName, phone, and loanAmount are required" },
              400,
            );
          }

          const authHeader = request.headers.get("Authorization");
          const token = extractBearerToken(authHeader);
          const user = token ? await verifyToken(token) : null;

          const newLead = await sql`
            INSERT INTO home_loan_leads (
              user_id,
              applicant_name,
              phone,
              email,
              monthly_income,
              loan_amount,
              city,
              employment_type,
              existing_emi,
              status,
              created_at
            )
            VALUES (
              ${user ? user.id : null},
              ${applicantName.trim()},
              ${phone.trim()},
              ${email?.trim() || null},
              ${monthlyIncome || 0},
              ${loanAmount},
              ${city?.trim() || "Hyderabad"},
              ${employmentType || "salaried"},
              ${existingEmi},
              'new',
              NOW()
            )
            RETURNING *
          `;

          return jsonResponse(
            {
              ok: true,
              message: "Home loan application submitted successfully",
              data: newLead[0],
            },
            201,
          );
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },
    },
  },
});
