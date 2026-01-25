-- Create extension for gen_random_uuid if not present
create extension if not exists "pgcrypto";

-- Table: page_views
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  user_id uuid null,
  referrer text null,
  user_agent text null,
  viewed_at timestamptz not null default now()
);

-- Indexes to improve analytics queries
create index if not exists page_views_viewed_at_idx on public.page_views(viewed_at);
create index if not exists page_views_path_idx on public.page_views(path);
create index if not exists page_views_user_id_idx on public.page_views(user_id);

-- Enable RLS
alter table public.page_views enable row level security;

-- Allow inserts from both anonymous and authenticated clients
create policy "Public can insert page views" on public.page_views
  for insert
  to public
  with check (
    -- Allow anonymous (auth.uid() is null) writing rows with null user_id
    auth.uid() is null and user_id is null
    or
    -- Allow authenticated users to insert with their own user_id
    auth.uid() is not null and user_id = auth.uid()
  );

-- Only admins can select analytics data
create policy "Admins can select page views" on public.page_views
  for select
  to public
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- Optionally, restrict updates/deletes (disable by default)
-- Revoke default privileges if necessary (Supabase usually has none for RLS-enabled tables)
