-- ============================================================
-- WMove — Multi-tenancy: profiles, companies e RLS por locadora
-- ============================================================

-- ============================================================
-- PROFILES (1:1 com auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self" on public.profiles
  for all to authenticated
  using  (id = auth.uid())
  with check (id = auth.uid());

grant select, insert, update on public.profiles to authenticated;

-- ============================================================
-- COMPANIES (locadoras — uma por conta)
-- ============================================================
create table public.companies (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  cnpj          text,
  phone         text,
  cep           text,
  address       text,
  address_num   text,
  complement    text,
  city          text,
  uf            char(2),
  plan          text not null default 'wgo',
  fleet_option  text,
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at    timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "companies_owner" on public.companies
  for all to authenticated
  using  (owner_id = auth.uid())
  with check (owner_id = auth.uid());

grant select, insert, update on public.companies to authenticated;

-- ============================================================
-- TRIGGER: cria profile + company automaticamente no signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  insert into public.companies (
    owner_id, name, cnpj, phone,
    cep, address, address_num, complement, city, uf,
    plan, fleet_option
  ) values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'), ''), 'Minha Locadora'),
    new.raw_user_meta_data->>'cnpj',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cep',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'address_num',
    new.raw_user_meta_data->>'complement',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'uf',
    coalesce(nullif(new.raw_user_meta_data->>'plan', ''), 'wgo'),
    new.raw_user_meta_data->>'fleet_option'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Adiciona company_id nas tabelas existentes
-- ============================================================
alter table public.customers    add column company_id uuid references public.companies(id) on delete cascade;
alter table public.vehicles     add column company_id uuid references public.companies(id) on delete cascade;
alter table public.rentals      add column company_id uuid references public.companies(id) on delete cascade;
alter table public.payments     add column company_id uuid references public.companies(id) on delete cascade;
alter table public.maintenances add column company_id uuid references public.companies(id) on delete cascade;

-- Índices para acelerar as queries de RLS
create index on public.customers    (company_id);
create index on public.vehicles     (company_id);
create index on public.rentals      (company_id);
create index on public.payments     (company_id);
create index on public.maintenances (company_id);

-- ============================================================
-- RLS: substitui as políticas permissivas por isolamento por locadora
-- ============================================================
drop policy if exists "authenticated_all" on public.customers;
drop policy if exists "authenticated_all" on public.vehicles;
drop policy if exists "authenticated_all" on public.rentals;
drop policy if exists "authenticated_all" on public.payments;
drop policy if exists "authenticated_all" on public.maintenances;

-- Helper: retorna o id da company do usuário logado
create or replace function public.my_company_id()
returns uuid
language sql stable
as $$
  select id from public.companies where owner_id = auth.uid() limit 1;
$$;

-- Customers
create policy "customers_company" on public.customers
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

-- Vehicles
create policy "vehicles_company" on public.vehicles
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

-- Rentals
create policy "rentals_company" on public.rentals
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

-- Payments
create policy "payments_company" on public.payments
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

-- Maintenances
create policy "maintenances_company" on public.maintenances
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

grant select, insert, update, delete on public.customers    to authenticated;
grant select, insert, update, delete on public.vehicles     to authenticated;
grant select, insert, update, delete on public.rentals      to authenticated;
grant select, insert, update, delete on public.payments     to authenticated;
grant select, insert, update, delete on public.maintenances to authenticated;
