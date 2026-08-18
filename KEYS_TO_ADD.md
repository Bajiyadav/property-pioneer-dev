## Keys to add TOMORROW

### 1. Supabase (Already Have)

- VITE_SUPABASE_URL ✓
- VITE_SUPABASE_PUBLISHABLE_KEY ✓
- SUPABASE_URL ✓
- SUPABASE_SERVICE_ROLE_KEY ✓

### 2. Critical - Add for CD/Deploy

SUPABASE_DB_URL=postgresql://[user]:[password]@[host]/[database]
→ Get from Supabase Dashboard → Connection Strings → Session mode (URI)

### 3. Optional - Enable Plans

RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
→ Get from Razorpay Dashboard

### 4. Optional - CAPTCHA

VITE_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
→ Get from Cloudflare Dashboard

## How to add in Vercel:

vercel env add SUPABASE_DB_URL production
vercel env add RAZORPAY_KEY_ID production
vercel env add RAZORPAY_KEY_SECRET production
