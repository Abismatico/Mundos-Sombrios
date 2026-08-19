-- Supabase schema for Mundos Sombrios
-- 1) profiles
create table if not exists public.profiles (
  id text primary key,
  username text not null,
  email text,
  role text not null default 'jogador',
  password_hash text,
  banned boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

alter table public.profiles add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists banned boolean not null default false;
alter table public.profiles add column if not exists status text not null default 'active';

alter table public.admin_requests add column if not exists data jsonb not null default '{}'::jsonb;

-- 2) tables
create table if not exists public.tables (
  id text primary key,
  code text not null unique,
  name text not null,
  theme text not null default 'default',
  game_mode text not null default 'exodo',
  owner_id text not null,
  participants jsonb not null default '[]'::jsonb,
  banned jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  settings jsonb not null default '{}'::jsonb
);

-- 3) characters
create table if not exists public.characters (
  id text primary key,
  owner_id text not null,
  user_id text not null,
  name text not null,
  mode text not null default 'exodo',
  nature text,
  class_name text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) admin_requests
create table if not exists public.admin_requests (
  id text primary key,
  user_id text not null,
  username text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

-- 5) site_content (portal content and content blocks moved from JS to Supabase)
create table if not exists public.site_content (
  key text primary key,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6) posts (editorial content and announcements)
create table if not exists public.posts (
  id text primary key,
  slug text not null unique,
  type text not null default 'post',
  title text not null,
  subtitle text,
  summary text,
  body text,
  category text,
  world text,
  status text not null default 'draft',
  published boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7) site_settings (generic key/value settings)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- helpful indexes
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_tables_owner on public.tables(owner_id);
create index if not exists idx_tables_code on public.tables(code);
create index if not exists idx_characters_owner on public.characters(owner_id);
create index if not exists idx_admin_requests_user on public.admin_requests(user_id);
create index if not exists idx_posts_status on public.posts(status, published);
create index if not exists idx_site_content_updated_at on public.site_content(updated_at desc);

-- optional: enable public read/write for prototype only
alter table public.profiles enable row level security;
alter table public.tables enable row level security;
alter table public.characters enable row level security;
alter table public.admin_requests enable row level security;
alter table public.site_content enable row level security;
alter table public.posts enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "allow all public access profiles" on public.profiles;
create policy "allow all public access profiles"
on public.profiles
for all
using (true)
with check (true);

drop policy if exists "allow all public access tables" on public.tables;
create policy "allow all public access tables"
on public.tables
for all
using (true)
with check (true);

drop policy if exists "allow all public access characters" on public.characters;
create policy "allow all public access characters"
on public.characters
for all
using (true)
with check (true);

drop policy if exists "allow all public access admin_requests" on public.admin_requests;
create policy "allow all public access admin_requests"
on public.admin_requests
for all
using (true)
with check (true);

drop policy if exists "allow all public access site_content" on public.site_content;
create policy "allow all public access site_content"
on public.site_content
for all
using (true)
with check (true);

drop policy if exists "allow all public access posts" on public.posts;
create policy "allow all public access posts"
on public.posts
for all
using (true)
with check (true);

drop policy if exists "allow all public access site_settings" on public.site_settings;
create policy "allow all public access site_settings"
on public.site_settings
for all
using (true)
with check (true);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_tables_updated_at on public.tables;
create trigger trg_tables_updated_at
before update on public.tables
for each row execute function public.touch_updated_at();

drop trigger if exists trg_characters_updated_at on public.characters;
create trigger trg_characters_updated_at
before update on public.characters
for each row execute function public.touch_updated_at();

drop trigger if exists trg_admin_requests_updated_at on public.admin_requests;
create trigger trg_admin_requests_updated_at
before update on public.admin_requests
for each row execute function public.touch_updated_at();

drop trigger if exists trg_site_content_updated_at on public.site_content;
create trigger trg_site_content_updated_at
before update on public.site_content
for each row execute function public.touch_updated_at();

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
before update on public.posts
for each row execute function public.touch_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.touch_updated_at();
