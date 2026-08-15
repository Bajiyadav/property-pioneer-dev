# Urban Rental Flats (URF) — React Native / Mobile App Architecture Roadmap

> **Author**: Staff Mobile Architect & Lead Full-Stack Engineer  
> **Target Technology**: Expo / React Native (iOS & Android Monorepo)  
> **Estimated Code Reuse Rate**: **70% Shared Core Logic**

---

## 1. Monorepo Architecture Blueprint

URF's current architecture utilizes **TypeScript**, **Zod validation**, **TanStack Query**, and **Supabase JS Client**. This allows seamless abstraction into a unified monorepo structure (e.g. Turborepo / Nx).

```
                            URF MONOREPO REPOSITORY
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         ▼                                                           ▼
  apps/web (TanStack Start)                                 apps/mobile (Expo / React Native)
  ├─ Custom Web Components                                  ├─ Native Navigation (React Navigation)
  └─ Web Specific Styles                                    └─ Native UI (NativeWind / Tailwind)
         │                                                           │
         └─────────────────────────────┬─────────────────────────────┘
                                       ▼
                            packages/shared-core
                            ├─ Supabase Client Config & Auth Helpers [100% Shared]
                            ├─ Zod Schemas (Property, Search, Inquiry) [100% Shared]
                            ├─ TanStack Query Hooks (useProperties, etc.) [90% Shared]
                            ├─ Formatting Utilities (INR currency, Dates) [100% Shared]
                            └─ Constants & Config (Cities, Amenities)  [100% Shared]
```

---

## 2. Reusability Breakdown & Compatibility Audit

| Code Category          | File Paths in Web App                      | Mobile Reusability | Adaptation Effort                                                                                              |
| :--------------------- | :----------------------------------------- | :----------------: | :------------------------------------------------------------------------------------------------------------- |
| **Supabase Client**    | `src/integrations/supabase/client.ts`      |      **100%**      | Drop-in reuse with `AsyncStorage` adapter.                                                                     |
| **Validation Schemas** | `src/lib/validations/property.ts`          |      **100%**      | Shared Zod schemas imported directly.                                                                          |
| **Data Fetchers**      | `src/lib/properties.ts`, `useFavorites.ts` |      **90%**       | Reusable TanStack Query hooks; substitute web storage with AsyncStorage.                                       |
| **App Configuration**  | `src/config/app.ts`                        |      **100%**      | Shared constants (Cities, Types, Metadata).                                                                    |
| **UI Components**      | `src/components/ui/*`                      |      **25%**       | Web uses DOM HTML tags (`<div>`, `<button>`); mobile will use NativeWind (`View`, `Text`, `TouchableOpacity`). |

---

## 3. Shared Mobile & Web Data Layer Example

```typescript
// Shared Hook: packages/shared-core/hooks/useProperties.ts
import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "../api/properties";

export function useProperties(searchParams?: PropertySearchParams) {
  return useQuery({
    queryKey: ["properties", searchParams],
    queryFn: () => fetchProperties(searchParams),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
```

---

## 4. Mobile Native Feature Roadmap

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      NATIVE MOBILE FEATURE PIPELINE                      │
├───────────────────┬───────────────────────────────────┬──────────────────┤
│ Native Feature    │ Mobile Capability                 │ User Impact      │
├───────────────────┼───────────────────────────────────┼──────────────────┤
│ Push Notifications│ Expo Notifications (FCM / APNs)   │ Instant lead alert│
│ Location Services │ React Native Geolocation          │ Near me search   │
│ Camera & Storage  │ Expo ImagePicker / Camera         │ Instant property │
│                   │                                   │ photo uploads    │
│ Native Maps       │ React Native Maps (Google/Apple)  │ Smooth 60fps map │
│ Offline Mode      │ TanStack Query + AsyncStorage     │ Browse offline   │
└───────────────────┴───────────────────────────────────┴──────────────────┘
```

---

## 5. Mobile Development Timeline & Milestones

- **Week 1–2**: Monorepo structure setup (`Turborepo` + `packages/shared-core`).
- **Week 3–4**: Expo project initialization with NativeWind and shared authentication flow.
- **Week 5–6**: Property search list, detail screen, and native map integration.
- **Week 7–8**: Owner photo upload integration, push notifications, and App Store / Google Play store submissions.
