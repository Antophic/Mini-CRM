create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  company text not null check (char_length(trim(company)) > 0),
  email text,
  phone text,
  status text not null default 'New Lead' check (
    status in ('New Lead', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost')
  ),
  deal_value numeric(12, 2) not null default 0 check (deal_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists clients_status_idx on public.clients(status);
create index if not exists client_notes_client_id_idx on public.client_notes(client_id);
create index if not exists client_notes_user_id_idx on public.client_notes(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.client_notes enable row level security;

drop policy if exists "Users can read own clients" on public.clients;
create policy "Users can read own clients"
on public.clients
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own clients" on public.clients;
create policy "Users can insert own clients"
on public.clients
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own clients" on public.clients;
create policy "Users can update own clients"
on public.clients
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own clients" on public.clients;
create policy "Users can delete own clients"
on public.clients
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read notes for own clients" on public.client_notes;
create policy "Users can read notes for own clients"
on public.client_notes
for select
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients
    where clients.id = client_notes.client_id
      and clients.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert notes for own clients" on public.client_notes;
create policy "Users can insert notes for own clients"
on public.client_notes
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients
    where clients.id = client_notes.client_id
      and clients.user_id = auth.uid()
  )
);

drop policy if exists "Users can update notes for own clients" on public.client_notes;
create policy "Users can update notes for own clients"
on public.client_notes
for update
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients
    where clients.id = client_notes.client_id
      and clients.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients
    where clients.id = client_notes.client_id
      and clients.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete notes for own clients" on public.client_notes;
create policy "Users can delete notes for own clients"
on public.client_notes
for delete
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.clients
    where clients.id = client_notes.client_id
      and clients.user_id = auth.uid()
  )
);
