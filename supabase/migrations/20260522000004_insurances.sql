-- ============================================================
-- WMove — Seguros de veículos
-- ============================================================

create table public.insurances (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  vehicle_id     uuid not null references public.vehicles(id) on delete restrict,
  insurer        text not null,
  policy_number  text,
  coverage_type  text not null default 'comprehensive',
  coverage_value numeric(12,2),
  premium        numeric(10,2),
  premium_period text not null default 'annual',
  start_date     date not null,
  end_date       date not null,
  deductible     numeric(10,2),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index on public.insurances (company_id);
create index on public.insurances (vehicle_id);
create index on public.insurances (end_date);

create trigger trg_insurances_updated_at
  before update on public.insurances
  for each row execute function public.set_updated_at();

alter table public.insurances enable row level security;

create policy "insurances_company" on public.insurances
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

grant select, insert, update, delete on public.insurances to authenticated;
