# Urban Rental Flats (URF) — React Component Hierarchy & Documentation

## Complete Component Tree

```text
RootShell (src/routes/__root.tsx)
├── SiteHeader
│   ├── BrandMark
│   └── Navigation Links (Browse, Saved, Admin/Sign in)
├── Outlet (Active Route Component)
│   ├── Index (src/routes/index.tsx)
│   │   ├── BrandMark / Hero Banner
│   │   └── PropertyCard Grid
│   │       └── BrandMark / Heart Save Button
│   ├── PropertiesPage (src/routes/properties.index.tsx)
│   │   ├── Search & Filter Bar (Keywords, City, Listing Type, Bedrooms, Price)
│   │   └── PropertyCard Grid
│   ├── PropertyDetail (src/routes/properties.$id.tsx)
│   │   ├── PropertyStructuredData (JSON-LD script)
│   │   ├── Photo Gallery & Cover Image
│   │   ├── Spec Badges (Bedrooms, Bathrooms, Area)
│   │   └── EnquiryForm Modal
│   │       └── TurnstileWidget (Cloudflare Turnstile CAPTCHA)
│   ├── FavoritesPage (src/routes/favorites.tsx)
│   │   └── PropertyCard Grid
│   ├── AuthPage (src/routes/auth.tsx)
│   │   ├── BrandMark
│   │   ├── Input, Label, Button primitives
│   │   └── Supabase Auth handlers
│   └── AdminDashboard (src/routes/_authenticated/admin.tsx)
│       └── AdminShell
│           ├── BrandMark
│           ├── MetricsPanel (Metric Cards, City Coverage Badges)
│           ├── ListingsPanel (Table, TableHeader, TableRow, TableCell, Action Buttons)
│           ├── EnquiriesPanel (Card, Lead Details)
│           └── AuditPanel (Table, TableHeader, TableRow, Security Logs)
├── SiteFooter
│   └── BrandMark
└── Toaster (Sonner notification container)
```

---

## Core Application Components

### 1. `BrandMark` (`src/components/BrandMark.tsx`)

- **Purpose**: Displays the official Urban Rental Flats logo and name with responsive size presets.
- **Props**:
  - `size?: "sm" | "md" | "lg"` (default: `"md"`)
  - `responsiveName?: boolean` (hides text on small mobile viewports)
  - `className?: string`
- **Hooks**: None
- **Dependencies**: Lucide React (`Building2`)
- **Reusability**: High. Used in header, footer, auth page, admin shell, and fallback error screens.

---

### 2. `PropertyCard` (`src/components/PropertyCard.tsx`)

- **Purpose**: Displays a property listing card with cover image, title, price badge, specs (bd, ba, ft²), city, and save heart toggle button.
- **Props**:
  - `property: Property`
- **State**: `saved: boolean` (derived from `useFavorites` hook)
- **Hooks**: `useFavorites()`
- **Dependencies**: `@tanstack/react-router` (`Link`), Lucide React (`Heart`, `MapPin`, `BedDouble`, `Bath`, `Maximize`), `formatPrice()`
- **Parent Components**: `index.tsx`, `properties.index.tsx`, `favorites.tsx`
- **Performance**: Uses `loading="lazy"` on cover image and hover transform CSS transition.

---

### 3. `TurnstileWidget` (`src/components/TurnstileWidget.tsx`)

- **Purpose**: Renders Cloudflare Turnstile CAPTCHA widget dynamically if site key is configured.
- **Props**:
  - `onToken: (token: string | undefined) => void`
  - `className?: string`
- **State**: Widget script loaded state & container ref.
- **Hooks**: `useEffect`, `useRef`, `useState`
- **Dependencies**: Cloudflare Turnstile JavaScript API (`https://challenges.cloudflare.com/turnstile/v0/api.js`)
- **Parent Component**: `EnquiryForm` inside `properties.$id.tsx`

---

## Page Route Components

### 1. `RootComponent` (`src/routes/__root.tsx`)

- **Purpose**: Main application wrapper providing QueryClient context, global auth state listener, header, main outlet, footer, and Sonner toast.
- **Hooks**: `useRouter()`, `useEffect()`, `useState()`
- **Child Components**: `SiteHeader`, `SiteFooter`, `Outlet`, `Toaster`

### 2. `PropertiesPage` (`src/routes/properties.index.tsx`)

- **Purpose**: Main listing search page with real-time reactive filters for keyword, city, listing type, bedroom count, and price range.
- **Hooks**: `Route.useSearch()`, `useNavigate()`, `useQuery()`, `useMemo()`
- **Child Components**: `PropertyCard` grid

### 3. `PropertyDetail` (`src/routes/properties.$id.tsx`)

- **Purpose**: Listing detail page with multi-image gallery switcher, specs grid, save button, and contact enquiry form modal.
- **Hooks**: `Route.useParams()`, `useFavorites()`, `useState()`, `useQuery()`
- **Child Components**: `PropertyStructuredData`, `EnquiryForm`

### 4. `AdminDashboard` (`src/routes/_authenticated/admin.tsx`)

- **Purpose**: Master control panel for platform administrators featuring overview metrics, listing approvals, customer lead inbox, and activity audit logs.
- **Hooks**: `useServerFn()`, `useQuery()`, `useMutation()`, `useQueryClient()`, `useState()`
- **Child Components**: `AdminShell`, `MetricsPanel`, `ListingsPanel`, `EnquiriesPanel`, `AuditPanel`

---

## Radix UI Primitive Wrapper Library (`src/components/ui/`)

The application includes 46 Radix UI accessible component primitives styled with Tailwind CSS v4:

- `button.tsx`: Variant-driven button component using `class-variance-authority` (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`).
- `card.tsx`: Card container, header, footer, title, description primitives.
- `dialog.tsx`: Accessible modal dialog wrapper using `@radix-ui/react-dialog`.
- `table.tsx`: HTML table primitives (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`).
- `tabs.tsx`: Accessible tab switcher using `@radix-ui/react-tabs`.
- `badge.tsx`: Status indicator badges (`default`, `secondary`, `destructive`, `outline`).
- `input.tsx` / `textarea.tsx`: Form control primitives.
- `skeleton.tsx`: Skeleton loading placeholder.
- Additional primitives: `accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `breadcrumb`, `calendar`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `slider`, `sonner`, `switch`, `toggle-group`, `toggle`, `tooltip`.
