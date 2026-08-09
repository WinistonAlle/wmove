-- ============================================================
-- WMove — Documentos (CRLV, CNH, contratos escaneados…)
-- ============================================================

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  vehicle_id  uuid references public.vehicles(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  rental_id   uuid references public.rentals(id) on delete set null,
  name        text not null,
  doc_type    text not null default 'other',
  -- crlv | cnh | contract | insurance | fine | inspection | other
  file_path   text not null,
  file_name   text not null,
  file_size   int,
  mime_type   text,
  notes       text,
  expires_at  date,
  created_at  timestamptz not null default now()
);

create index on public.documents (company_id);
create index on public.documents (vehicle_id);
create index on public.documents (customer_id);
create index on public.documents (doc_type);

alter table public.documents enable row level security;

create policy "documents_company" on public.documents
  for all to authenticated
  using  (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

grant select, insert, update, delete on public.documents to authenticated;

-- ── Storage bucket (wmove-docs) ──────────────────────────────
insert into storage.buckets (id, name, public)
values ('wmove-docs', 'wmove-docs', false)
on conflict do nothing;

-- Arquivos ficam em {company_id}/{doc_type}/{filename}
create policy "docs_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wmove-docs'
    and (storage.foldername(name))[1] = (public.my_company_id())::text
  );

create policy "docs_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'wmove-docs'
    and (storage.foldername(name))[1] = (public.my_company_id())::text
  );

create policy "docs_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'wmove-docs'
    and (storage.foldername(name))[1] = (public.my_company_id())::text
  );
