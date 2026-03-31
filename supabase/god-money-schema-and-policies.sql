-- God Money - Schema e Policies iniciais para uso com SUPABASE_ANON_KEY
-- Projeto/ref detectado: yfyigoorkyvwnyhujvzn
-- URL esperada: https://yfyigoorkyvwnyhujvzn.supabase.co
--
-- IMPORTANTE:
-- Estas policies foram pensadas para fazer o projeto funcionar AGORA com anon key.
-- Para produção mais séria, o ideal é migrar o backend para SUPABASE_SERVICE_ROLE_KEY
-- e reduzir as permissões públicas.

begin;

create extension if not exists pgcrypto;

-- =========================
-- TABELA DE INTERAÇÕES
-- =========================
create table if not exists public.bot_interactions (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  chat_id text,
  user_id text,
  username text,
  command text,
  input text,
  response_preview text,
  source text,
  status text default 'ok'
);

create index if not exists bot_interactions_created_at_idx
  on public.bot_interactions (created_at desc);

create index if not exists bot_interactions_user_id_idx
  on public.bot_interactions (user_id);


-- =========================
-- CACHE DE NOTÍCIAS
-- =========================
create table if not exists public.news_cache (
  id bigserial primary key,
  url text unique not null,
  title text not null,
  summary text,
  source text default 'InfoMoney',
  ticker text,
  keywords text[] default '{}',
  topic_hint text,
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

create index if not exists news_cache_fetched_at_idx
  on public.news_cache (fetched_at desc);

create index if not exists news_cache_ticker_idx
  on public.news_cache (ticker);


-- =========================
-- USUÁRIOS
-- =========================
create table if not exists public.users (
  id bigserial primary key,
  telegram_user_id text unique not null,
  username text,
  first_name text,
  profile_type text default 'geral',
  plan text default 'free',
  status text default 'active',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists users_telegram_user_id_idx
  on public.users (telegram_user_id);


-- =========================
-- WATCHLISTS
-- =========================
create table if not exists public.watchlists (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  ticker text not null,
  created_at timestamptz not null default now(),
  unique (user_id, ticker)
);

create index if not exists watchlists_user_id_idx
  on public.watchlists (user_id);

create index if not exists watchlists_ticker_idx
  on public.watchlists (ticker);


-- =========================
-- SUBSCRIPTIONS
-- =========================
create table if not exists public.subscriptions (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  plan text not null,
  status text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  billing_provider text,
  external_id text,
  created_at timestamptz not null default now()
);


-- =========================
-- FEATURE USAGE
-- =========================
create table if not exists public.feature_usage (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  feature text not null,
  value integer default 1,
  created_at timestamptz not null default now()
);


-- =========================
-- ALERTS
-- =========================
create table if not exists public.alerts (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  ticker text,
  alert_type text,
  rule jsonb,
  active boolean default true,
  created_at timestamptz not null default now()
);


-- =========================
-- RLS
-- =========================
alter table public.bot_interactions enable row level security;
alter table public.news_cache enable row level security;
alter table public.users enable row level security;
alter table public.watchlists enable row level security;
alter table public.subscriptions enable row level security;
alter table public.feature_usage enable row level security;
alter table public.alerts enable row level security;


-- Remove policies antigas com mesmo nome, se existirem
drop policy if exists "anon can insert bot_interactions" on public.bot_interactions;
drop policy if exists "anon can read bot_interactions" on public.bot_interactions;

drop policy if exists "anon can read news_cache" on public.news_cache;
drop policy if exists "anon can write news_cache" on public.news_cache;
drop policy if exists "anon can update news_cache" on public.news_cache;

drop policy if exists "anon can read users" on public.users;
drop policy if exists "anon can insert users" on public.users;
drop policy if exists "anon can update users" on public.users;

drop policy if exists "anon can read watchlists" on public.watchlists;
drop policy if exists "anon can insert watchlists" on public.watchlists;
drop policy if exists "anon can delete watchlists" on public.watchlists;

drop policy if exists "anon can read subscriptions" on public.subscriptions;
drop policy if exists "anon can write feature_usage" on public.feature_usage;
drop policy if exists "anon can read feature_usage" on public.feature_usage;
drop policy if exists "anon can read alerts" on public.alerts;
drop policy if exists "anon can write alerts" on public.alerts;
drop policy if exists "anon can delete alerts" on public.alerts;


-- bot_interactions
create policy "anon can insert bot_interactions"
on public.bot_interactions
for insert
to anon
with check (true);

create policy "anon can read bot_interactions"
on public.bot_interactions
for select
to anon
using (true);


-- news_cache
create policy "anon can read news_cache"
on public.news_cache
for select
to anon
using (true);

create policy "anon can write news_cache"
on public.news_cache
for insert
to anon
with check (true);

create policy "anon can update news_cache"
on public.news_cache
for update
to anon
using (true)
with check (true);


-- users
create policy "anon can read users"
on public.users
for select
to anon
using (true);

create policy "anon can insert users"
on public.users
for insert
to anon
with check (true);

create policy "anon can update users"
on public.users
for update
to anon
using (true)
with check (true);


-- watchlists
create policy "anon can read watchlists"
on public.watchlists
for select
to anon
using (true);

create policy "anon can insert watchlists"
on public.watchlists
for insert
to anon
with check (true);

create policy "anon can delete watchlists"
on public.watchlists
for delete
to anon
using (true);


-- subscriptions
create policy "anon can read subscriptions"
on public.subscriptions
for select
to anon
using (true);


-- feature_usage
create policy "anon can write feature_usage"
on public.feature_usage
for insert
to anon
with check (true);

create policy "anon can read feature_usage"
on public.feature_usage
for select
to anon
using (true);


-- alerts
create policy "anon can read alerts"
on public.alerts
for select
to anon
using (true);

create policy "anon can write alerts"
on public.alerts
for insert
to anon
with check (true);

create policy "anon can delete alerts"
on public.alerts
for delete
to anon
using (true);

commit;

-- NOTA:
-- Para segurança real em produção:
-- 1. migrar o backend para SERVICE_ROLE_KEY
-- 2. substituir policies abertas por policies baseadas em auth.uid() ou service role
-- 3. não expor anon key com privilégios excessivos em frontends públicos
