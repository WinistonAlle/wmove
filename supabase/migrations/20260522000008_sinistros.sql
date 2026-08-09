-- ============================================================
-- WMove — Sinistros (acidentes, avarias, acionamento de seguro)
-- ============================================================

create table public.sinistros (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  vehicle_id      uuid not null references public.vehicles(id) on delete restrict,
  rental_id       uuid references public.rentals(id) on delete set null,
  customer_id     uuid references public.customers(id) on delete set null,
  date            date not null,
  type            text not null default 'accident',
  -- accident | theft | vandalism | flood | fire | other
  description     text not null,
  location        text,
  third_party     boolean not null default false,
  third_party_info text,
  police_report   text,
  insurance_claim text,
  status          text not null default 'open',
  -- open | in_progress | resolved | cancelled
  repair_cost     numeric(10,2),
  franchise       numeric(10,2),
  franchise_paid  boolean not null default false,
  resolution_notes text,
  resolved_at     date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.sinistros (company_id);
create index on public.sinistros (vehicle_id);
create index on public.sinistros (rental_id);
create index on public.sinistros (status);

alter table public.sinistros enable row level security;

create policy "sinistros_company" on public.sinistros
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

grant select, insert, update, delete on public.sinistros to authenticated;

create trigger trg_sinistros_updated_at
  before update on public.sinistros
  for each row execute function public.set_updated_at();
