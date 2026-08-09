-- ============================================================
-- WMove — Despesas operacionais (combustível, IPVA, limpeza…)
-- ============================================================

create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  vehicle_id  uuid references public.vehicles(id) on delete set null,
  category    text not null default 'other',
  description text not null,
  amount      numeric(10,2) not null,
  date        date not null,
  notes       text,
  created_at  timestamptz not null default now()
);

create index on public.expenses (company_id);
create index on public.expenses (vehicle_id);
create index on public.expenses (date);

alter table public.expenses enable row level security;

create policy "expenses_company" on public.expenses
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

grant select, insert, update, delete on public.expenses to authenticated;
