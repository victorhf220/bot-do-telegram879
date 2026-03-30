# God Money Bot

Bot do Telegram em **Node.js** para notícias da bolsa de valores, com foco em **InfoMoney**, preparado para deploy no **Render** e persistência opcional no **Supabase**.

## Recursos

- `/start` — apresentação do bot
- `/menu` — lista de comandos
- `/noticias` — últimas notícias da bolsa
- `/ibov` — resumo do Ibovespa baseado em notícias recentes
- `/acao TICKER` — notícias de uma ação ou empresa
- `/agenda` — agenda econômica / eventos do mercado
- `/resumo` — briefing rápido do mercado
- webhook pronto para Render
- polling automático em ambiente local
- integração opcional com Supabase para log de interações

## Requisitos

- Node.js 20+
- token do bot do Telegram
- URL pública no Render para webhook em produção

## Rodando localmente

```bash
npm install
cp .env.example .env
npm start
```

Em desenvolvimento, se `BASE_URL` não estiver definida, o bot usa **long polling**.

## Variáveis principais

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `BASE_URL` → URL pública do Render, ex.: `https://god-money-bot.onrender.com`
- `TELEGRAM_SECRET_PATH` → caminho opcional do webhook
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_ANON_KEY`

## Deploy no Render

Você pode usar o `render.yaml` ou criar um Web Service manualmente.

### Start command

```bash
npm start
```

### Build command

```bash
npm install
```

### Health check

```text
/health
```

## Sugestão de tabela no Supabase

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

## Observações

- A coleta de notícias foi pensada para usar **InfoMoney** como fonte principal.
- Se a estrutura do site mudar, a lógica de scraping pode precisar de ajuste.
- Em produção no Render, o ideal é usar **webhook**.
