# Cache de Notícias

## Objetivo

Transformar o God Money em uma arquitetura **cache first, AI second**.

Isso significa:

- buscar notícias uma vez
- salvar no Supabase
- responder usuários a partir do cache
- usar IA só quando realmente precisar

## Benefícios

- menos custo de token
- menos scraping repetido
- respostas mais rápidas
- projeto mais escalável

## Tabela sugerida

```sql
create table if not exists news_cache (
  id bigserial primary key,
  url text unique not null,
  title text not null,
  summary text,
  source text default 'InfoMoney',
  ticker text,
  keywords text[] default '{}',
  topic_hint text,
  published_at timestamptz,
  fetched_at timestamptz default now()
);

create index if not exists news_cache_fetched_at_idx on news_cache (fetched_at desc);
create index if not exists news_cache_ticker_idx on news_cache (ticker);
```

## Estratégia aplicada no projeto

1. o bot tenta buscar no cache primeiro
2. se não achar conteúdo suficiente, faz busca no InfoMoney
3. salva os resultados no Supabase
4. nas próximas consultas, responde usando o cache

## Resultado

Essa abordagem reduz bastante o consumo de recursos e prepara o God Money para crescer.
