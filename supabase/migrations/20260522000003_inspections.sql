-- ============================================================
-- WMove — Vistorias (checklist entrega/devolução)
-- ============================================================

create type inspection_type as enum ('pickup', 'return');

create table public.inspections (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  rental_id      uuid references public.rentals(id) on delete set null,
  vehicle_id     uuid not null references public.vehicles(id) on delete restrict,
  type           inspection_type not null,
  mileage        int,
  fuel_level     int not null default 100,
  clean          boolean not null default true,
  items          jsonb not null default '{}',
  damages        text,
  notes          text,
  inspector_name text,
  created_at     timestamptz not null default now()
);

create index on public.inspections (company_id);
create index on public.inspections (rental_id);
create index on public.inspections (vehicle_id);

alter table public.inspections enable row level security;

create policy "inspections_company" on public.inspections
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

grant select, insert, update, delete on public.inspections to authenticated;
