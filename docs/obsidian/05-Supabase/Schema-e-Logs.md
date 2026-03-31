# Supabase — Schema e Logs

## Tabela sugerida

```sql
create table if not exists bot_interactions (
  id bigserial primary key,
  created_at timestamptz default now(),
  chat_id text,
  user_id text,
  username text,
  command text,
  input text,
  response_preview text,
  source text,
  status text default 'ok'
);
```

## Uso

Salvar:

- comandos executados
- texto enviado pelo usuário
- preview da resposta
- status (`ok` / `error`)

## Futuro

- preferências do usuário
- watchlist por usuário
- histórico de ativos consultados
- agendamento de alertas

## Cache de notícias

Além da tabela de interações, o projeto agora recomenda uma tabela `news_cache` para reduzir scraping repetido e tornar o bot escalável.

Veja também:

- `Cache-de-Noticias.md`
