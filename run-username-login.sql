-- Manual migration to activate username login
-- Run this in Supabase SQL Editor (Project: gowtvvaijekpgozygrzj)
-- This will:
-- 1) Add unique, case-insensitive column `profiles.username`
-- 2) Update trigger `handle_new_user` to store username from auth metadata
-- 3) Create RPC `public.get_auth_email_by_username(text)` with proper grants

-- 1) Kolom username + indeks unik case-insensitive
alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_ci_unique
  on public.profiles (lower(username))
  where username is not null;

-- 2) Trigger untuk menyimpan username saat user baru dibuat
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'phone', null),
    coalesce(new.raw_user_meta_data->>'username', null)
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    username = excluded.username;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) RPC untuk resolve email dari username
create or replace function public.get_auth_email_by_username(_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(_username)
  limit 1;
$$;

grant execute on function public.get_auth_email_by_username(text)
  to anon, authenticated;

-- Uji cepat:
-- select public.get_auth_email_by_username('admin');
