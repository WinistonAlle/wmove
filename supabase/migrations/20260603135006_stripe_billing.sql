-- Stripe billing columns on companies
alter table public.companies
  add column if not exists stripe_customer_id      text unique,
  add column if not exists stripe_subscription_id  text unique,
  add column if not exists stripe_price_id         text,
  add column if not exists subscription_status     text default 'trialing'
    check (subscription_status in ('trialing','active','past_due','canceled','incomplete'));

comment on column public.companies.stripe_customer_id     is 'Stripe customer ID (cus_...)';
comment on column public.companies.stripe_subscription_id is 'Stripe subscription ID (sub_...)';
comment on column public.companies.stripe_price_id        is 'Active Stripe price ID (price_...)';
comment on column public.companies.subscription_status    is 'Mirrors Stripe subscription status';
