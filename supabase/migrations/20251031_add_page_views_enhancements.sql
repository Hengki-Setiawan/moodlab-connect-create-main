-- Enhance page_views to support unique visitors and UTM tracking
create extension if not exists "pgcrypto";

-- Safely add new columns if they don't exist
alter table public.page_views
  add column if not exists visitor_id uuid null,
  add column if not exists session_id uuid null,
  add column if not exists utm_source text null,
  add column if not exists utm_medium text null,
  add column if not exists utm_campaign text null,
  add column if not exists utm_term text null,
  add column if not exists utm_content text null;

-- Indexes for faster analytics
create index if not exists page_views_visitor_id_idx on public.page_views(visitor_id);
create index if not exists page_views_session_id_idx on public.page_views(session_id);
create index if not exists page_views_referrer_idx on public.page_views(referrer);

-- RLS policies remain valid; inserts already allowed for public.

