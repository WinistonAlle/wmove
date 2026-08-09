-- ============================================================
-- WMove — Agendamentos (reservas futuras)
-- ============================================================

create type booking_status as enum ('confirmed', 'pending', 'cancelled');

create table public.bookings (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  customer_id  uuid not null references public.customers(id) on delete restrict,
  vehicle_id   uuid not null references public.vehicles(id) on delete restrict,
  start_date   date not null,
  end_date     date not null,
  daily_rate   numeric(10,2) not null,
  status       booking_status not null default 'confirmed',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index on public.bookings (company_id);
create index on public.bookings (customer_id);
create index on public.bookings (vehicle_id);
create index on public.bookings (start_date);

create trigger trg_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

create policy "bookings_company" on public.bookings
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

grant select, insert, update, delete on public.bookings to authenticated;
