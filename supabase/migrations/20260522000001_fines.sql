  -- ============================================================
  -- WMove — Módulo de Multas
  -- ============================================================

  create type fine_status as enum ('pending', 'paid', 'contested');
  create type fine_responsibility as enum ('company', 'driver');

  create table public.fines (
    id               uuid primary key default gen_random_uuid(),
    company_id       uuid not null references public.companies(id) on delete cascade,
    vehicle_id       uuid references public.vehicles(id) on delete set null,
    rental_id        uuid references public.rentals(id) on delete set null,
    plate            text not null,
    infraction       text not null,
    infraction_code  text,
    amount           numeric(10,2) not null,
    infraction_date  date,
    due_date         date not null,
    status           fine_status not null default 'pending',
    responsibility   fine_responsibility not null default 'company',
    notes            text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
  );

  create index on public.fines (company_id);
  create index on public.fines (vehicle_id);
  create index on public.fines (due_date);
  create index on public.fines (status);

  create trigger trg_fines_updated_at
    before update on public.fines
    for each row execute function public.set_updated_at();

  alter table public.fines enable row level security;

  create policy "fines_company" on public.fines
    for all to authenticated
    using  (company_id = public.my_company_id())
    with check (company_id = public.my_company_id());

  grant select, insert, update, delete on public.fines to authenticated;
