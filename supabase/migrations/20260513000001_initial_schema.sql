-- ============================================================
-- WMove — Schema inicial
-- ============================================================

-- Extensão para UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- CLIENTES
-- ============================================================
create table public.customers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  cpf         text unique,
  email       text unique,
  phone       text,
  cnh         text,
  cnh_expiry  date,
  address     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- VEÍCULOS
-- ============================================================
create type vehicle_status as enum ('available', 'rented', 'maintenance', 'inactive');

create table public.vehicles (
  id            uuid primary key default uuid_generate_v4(),
  plate         text not null unique,
  brand         text not null,
  model         text not null,
  year          int,
  color         text,
  fuel_type     text,
  daily_rate    numeric(10, 2) not null,
  status        vehicle_status not null default 'available',
  mileage       int not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- LOCAÇÕES
-- ============================================================
create type rental_status as enum ('active', 'completed', 'cancelled');

create table public.rentals (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references public.customers(id) on delete restrict,
  vehicle_id      uuid not null references public.vehicles(id) on delete restrict,
  start_date      date not null,
  expected_end    date not null,
  end_date        date,
  daily_rate      numeric(10, 2) not null,
  total_amount    numeric(10, 2),
  status          rental_status not null default 'active',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- PAGAMENTOS
-- ============================================================
create type payment_method as enum ('cash', 'credit_card', 'debit_card', 'pix', 'transfer');
create type payment_status  as enum ('pending', 'paid', 'refunded');

create table public.payments (
  id          uuid primary key default uuid_generate_v4(),
  rental_id   uuid not null references public.rentals(id) on delete restrict,
  amount      numeric(10, 2) not null,
  method      payment_method not null,
  status      payment_status not null default 'pending',
  paid_at     timestamptz,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- MANUTENÇÕES
-- ============================================================
create type maintenance_type as enum ('preventive', 'corrective', 'revision');

create table public.maintenances (
  id          uuid primary key default uuid_generate_v4(),
  vehicle_id  uuid not null references public.vehicles(id) on delete restrict,
  type        maintenance_type not null,
  description text not null,
  cost        numeric(10, 2),
  date        date not null,
  mileage     int,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- FUNÇÃO: atualiza updated_at automaticamente
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create trigger trg_vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create trigger trg_rentals_updated_at
  before update on public.rentals
  for each row execute function public.set_updated_at();

-- ============================================================
-- FUNÇÃO: atualiza status do veículo ao criar/encerrar locação
-- ============================================================
create or replace function public.sync_vehicle_status()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' and new.status = 'active') then
    update public.vehicles set status = 'rented' where id = new.vehicle_id;
  elsif (TG_OP = 'UPDATE' and new.status in ('completed', 'cancelled') and old.status = 'active') then
    update public.vehicles set status = 'available' where id = new.vehicle_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_rental_sync_vehicle
  after insert or update on public.rentals
  for each row execute function public.sync_vehicle_status();

-- ============================================================
-- FUNÇÃO: calcula total da locação ao encerrar
-- ============================================================
create or replace function public.calc_rental_total()
returns trigger as $$
begin
  if (new.status = 'completed' and new.end_date is not null) then
    new.total_amount = (new.end_date - new.start_date) * new.daily_rate;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_rental_calc_total
  before update on public.rentals
  for each row execute function public.calc_rental_total();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.customers    enable row level security;
alter table public.vehicles     enable row level security;
alter table public.rentals      enable row level security;
alter table public.payments     enable row level security;
alter table public.maintenances enable row level security;

-- Apenas usuários autenticados acessam os dados
create policy "authenticated_all" on public.customers    for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.vehicles     for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.rentals      for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.payments     for all to authenticated using (true) with check (true);
create policy "authenticated_all" on public.maintenances for all to authenticated using (true) with check (true);
