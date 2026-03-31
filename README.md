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
- `/perfil` — perfil de leitura do mercado
- `/watchlist` — gestão de ativos do usuário
- `/radar` — radar personalizado pela watchlist
- `/plano` — mostra plano e limites
- `/upgrade` — mostra proposta premium
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
- `SERPER_API_KEY` (opcional, recomendado para fallback de busca)

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

### Cache de notícias

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

### SQL completo para schema + policies

O projeto agora inclui um arquivo pronto com schema e policies para uso com anon key:

```text
supabase/god-money-schema-and-policies.sql
```

Explicação adicional no vault:

```text
docs/obsidian/05-Supabase/SQL-e-Policies-Anon-Key.md
```

## Observações

- A coleta de notícias foi pensada para usar **InfoMoney** como fonte principal.
- Se a estrutura do site mudar, a lógica de scraping pode precisar de ajuste.
- Em produção no Render, o ideal é usar **webhook**.
- A arquitetura atual do projeto já foi ajustada para **cache first, AI second**, priorizando Supabase + regras determinísticas antes de qualquer camada de IA.
- Quando configurada, a **Serper API** entra como fallback inteligente para enriquecer resultados sem depender de IA cara.

## Obsidian

O projeto agora inclui uma estrutura pronta de vault em:

```text
docs/obsidian
```

Você pode abrir essa pasta no Obsidian para organizar estratégia, comandos, deploy, Supabase, operação e conteúdo do God Money.

O projeto agora também inclui documentação estratégica de produto, monetização, schema e roadmap dentro do vault.

## n8n

O projeto agora também inclui um workflow inicial do n8n para envio automático de resumo diário no Telegram:

```text
n8n/god-money-resumo-diario.json
```

Detalhes de uso e configuração estão em:

```text
docs/obsidian/04-Deploy/n8n-Resumo-Diario.md
```
