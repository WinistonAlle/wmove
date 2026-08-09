-- ============================================================
-- WMove — Abastecimentos (combustível por veículo)
-- ============================================================

create table public.fuel_entries (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  vehicle_id      uuid not null references public.vehicles(id) on delete cascade,
  date            date not null,
  liters          numeric(8,2) not null,
  price_per_liter numeric(6,3) not null,
  total_cost      numeric(10,2) not null,
  odometer        int,
  fuel_type       text not null default 'gasoline',
  -- gasoline | ethanol | diesel | gnv | flex
  station         text,
  full_tank       boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now()
);

create index on public.fuel_entries (company_id);
create index on public.fuel_entries (vehicle_id);
create index on public.fuel_entries (date);

alter table public.fuel_entries enable row level security;

create policy "fuel_company" on public.fuel_entries
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

grant select, insert, update, delete on public.fuel_entries to authenticated;
