-- Create extension for gen_random_uuid if not present
create extension if not exists "pgcrypto";

-- Table: page_contents
create table if not exists public.page_contents (
  id uuid primary key default gen_random_uuid(),
  page text not null unique,
  content jsonb not null default '{}'::jsonb,
  updated_by uuid null references auth.users(id) on update restrict on delete set null,
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.page_contents enable row level security;

-- Public read access (homepage/about should be viewable by everyone)
create policy "Public can read page contents" on public.page_contents
  for select
  to public
  using (true);

-- Only admins or moderators can insert page contents
create policy "Admins or moderators can insert page contents" on public.page_contents
  for insert
  to public
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','moderator')
    )
  );

-- Only admins or moderators can update page contents
create policy "Admins or moderators can update page contents" on public.page_contents
  for update
  to public
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','moderator')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','moderator')
    )
  );
