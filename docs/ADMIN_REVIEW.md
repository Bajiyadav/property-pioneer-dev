# Seedha Properties — Admin Governance, Security & Audit Log Review

> **Author**: Staff Software Architect & Security Engineer  
> **Route Audited**: `src/routes/_authenticated/admin.tsx`  
> **Database Security**: Supabase RLS & Audit Logs

---

## 1. Admin System Architecture Overview

The Admin System handles platform moderation, listing approval, audit logging, role management, and content control.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ADMIN ARCHITECTURE LAYER                         │
├──────────────────────────────────────────────────────────────────────────┤
│ 1. Gatekeeper: TanStack Router `beforeLoad` Auth & Admin Role Check      │
│ 2. Data Provider: TanStack Query + Supabase RLS Client                   │
│ 3. Database Integrity: Trigger-based Audit Logs (`audit_logs` table)     │
│ 4. Moderation Engines: Listing Verification, User Moderation, CMS        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Granular Admin Feature Evaluation Matrix

| Admin Subsystem                      | Implemented Capabilities                                          | Operational Gaps                                                     | Risk Level | Score (0–100) |
| :----------------------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------- | :--------: | :-----------: |
| **Role-Based Access Control (RBAC)** | Admin route guarded by session check                              | Lacks granular permission tiers (SuperAdmin vs Moderator vs Support) | **Medium** |    **78**     |
| **Property Moderation Queue**        | Listing creation, feature toggle (`is_featured`), edit capability | Lacks bulk approval actions & automated spam filter                  |  **Low**   |    **82**     |
| **Audit Logs Subsystem**             | Tracks entity modifications in `audit_logs` database table        | Lacks CSV export & admin IP/user-agent tracking                      |  **Low**   |    **84**     |
| **User & Role Management**           | Basic user status monitoring                                      | Lacks one-click user ban & OTP reset trigger                         | **Medium** |    **72**     |
| **Content Management System (CMS)**  | Static configuration in `app.ts`                                  | Lacks UI toggle for dynamic city banners & notice bars               |  **Low**   |    **70**     |
| **System Analytics**                 | Property count, category split                                    | Lacks real-time lead volume charts & funnel conversion metrics       | **Medium** |    **68**     |

---

## 3. Detailed Inspection of `src/routes/_authenticated/admin.tsx`

```typescript
// Architectural Review of Admin Route Security
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ location }) => {
    // 1. Session validation via Supabase Auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    // 2. Role verification check against user metadata / profiles table
    const isAdmin = await checkAdminRole(session.user.id);
    if (!isAdmin) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminDashboard,
});
```

---

## 4. Security & Audit Trail Governance

### Database RLS Audit Log Enforcement

Supabase migrations contain audit log triggers (`audit_logs` table) capturing `action_type`, `table_name`, `record_id`, and `performed_by`:

```sql
-- Security Audit Trigger (Verified in migrations)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  performed_by UUID REFERENCES auth.users(id),
  changes JSONB
);
```

### Key Security & Governance Recommendations

1. **Granular Admin Roles**: Implement `super_admin`, `city_manager`, `support_agent`, and `listing_verifier` roles.
2. **2FA Enforcement for Admins**: Require Time-based One-Time Password (TOTP) authenticator app setup for all accounts accessing `/admin`.
3. **Automated Listing Spam Filter**: Flag listings containing suspicious keywords (e.g. wire transfer requests, advance token scams) before they appear on the public catalog.
