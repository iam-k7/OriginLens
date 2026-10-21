-- One row per signed-up user, kept in sync from Supabase Auth.
-- Passwords are never copied here: Supabase Auth keeps only a hash of them in auth.users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own row. Writes come only from the trigger below.
create policy "Users read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create function public.sync_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'country'
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = excluded.email,
    country = coalesce(excluded.country, public.profiles.country),
    updated_at = now();
  return new;
end;
$$;

revoke execute on function public.sync_profile() from public, anon, authenticated;

-- Sign-up creates the user at the email-code step (name only); country arrives with the password step.
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.sync_profile();
create trigger on_auth_user_updated after update of email, raw_user_meta_data on auth.users
  for each row execute function public.sync_profile();

-- Users who signed up before this table existed.
insert into public.profiles (id, full_name, email, country)
select id, coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'), email, raw_user_meta_data ->> 'country'
from auth.users
on conflict (id) do nothing;
