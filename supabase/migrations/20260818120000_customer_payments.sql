-- Table to store Razorpay orders created by customers
create table public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  plan_id text not null,
  razorpay_order_id text not null unique,
  amount_paise integer not null,
  currency text not null default 'INR',
  status text not null default 'created', -- 'created', 'paid', 'failed'
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Table to store active entitlements for customers (e.g. premium access)
create table public.customer_entitlements (
  user_id uuid primary key references auth.users(id),
  plan_id text not null,
  active_until timestamp with time zone, -- null means lifetime
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Setup RLS
alter table public.customer_orders enable row level security;
alter table public.customer_entitlements enable row level security;

-- Customers can view their own orders
create policy "Customers can view their own orders"
  on public.customer_orders for select
  to authenticated
  using (auth.uid() = user_id);

-- Customers can view their own entitlements
create policy "Customers can view their own entitlements"
  on public.customer_entitlements for select
  to authenticated
  using (auth.uid() = user_id);

-- Only service role can insert/update these tables (handled via server actions)
create policy "Service role has full access to customer_orders"
  on public.customer_orders for all
  to service_role
  using (true)
  with check (true);

create policy "Service role has full access to customer_entitlements"
  on public.customer_entitlements for all
  to service_role
  using (true)
  with check (true);

-- Add updated_at trigger
create trigger set_customer_orders_updated_at
  before update on public.customer_orders
  for each row
  execute function public.handle_updated_at();

create trigger set_customer_entitlements_updated_at
  before update on public.customer_entitlements
  for each row
  execute function public.handle_updated_at();
