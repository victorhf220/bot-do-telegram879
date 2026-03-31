# Schema — Produto e Monetização

## Tabelas recomendadas

### users

```sql
create table if not exists users (
  id bigserial primary key,
  telegram_user_id text unique not null,
  username text,
  first_name text,
  profile_type text,
  plan text default 'free',
  status text default 'active',
  created_at timestamptz default now(),
  last_seen_at timestamptz default now()
);
```

### watchlists

```sql
create table if not exists watchlists (
  id bigserial primary key,
  user_id bigint references users(id) on delete cascade,
  ticker text not null,
  created_at timestamptz default now()
);
```

### subscriptions

```sql
create table if not exists subscriptions (
  id bigserial primary key,
  user_id bigint references users(id) on delete cascade,
  plan text not null,
  status text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  billing_provider text,
  external_id text,
  created_at timestamptz default now()
);
```

### feature_usage

```sql
create table if not exists feature_usage (
  id bigserial primary key,
  user_id bigint references users(id) on delete cascade,
  feature text not null,
  value integer default 1,
  created_at timestamptz default now()
);
```

### alerts

```sql
create table if not exists alerts (
  id bigserial primary key,
  user_id bigint references users(id) on delete cascade,
  ticker text,
  alert_type text,
  rule jsonb,
  active boolean default true,
  created_at timestamptz default now()
);
```

## Objetivo do schema

Permitir que o produto evolua para:

- segmentação por usuário
- monetização por plano
- limitação por recurso
- retenção baseada em comportamento
- alertas personalizados
