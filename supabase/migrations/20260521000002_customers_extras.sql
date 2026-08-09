-- Adiciona score de confiabilidade, blacklist e notas aos clientes
alter table public.customers
  add column if not exists score      int     not null default 100,
  add column if not exists blacklisted boolean not null default false,
  add column if not exists notes      text;
