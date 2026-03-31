# SQL e Policies — modo anon key

## Objetivo

Este arquivo existe para fazer o God Money funcionar com a **anon key do Supabase** no estágio atual do projeto.

## Arquivo principal

Use este arquivo SQL:

```text
supabase/god-money-schema-and-policies.sql
```

## O que ele cria

- `bot_interactions`
- `news_cache`
- `users`
- `watchlists`
- `subscriptions`
- `feature_usage`
- `alerts`

## O que ele faz nas policies

Ele habilita RLS e cria policies abertas para o papel `anon` nas tabelas necessárias para o bot funcionar agora.

## Importante

Isso é útil para:

- desenvolvimento
- MVP funcional
- backend simples rodando no Render

Mas **não é o desenho final ideal de segurança**.

## Recomendação futura

Quando o produto avançar:

1. usar `SUPABASE_SERVICE_ROLE_KEY` no backend
2. fechar policies públicas
3. aplicar regras por usuário autenticado
4. limitar leitura/escrita por contexto

## Como rodar

1. abra o painel do Supabase
2. vá em **SQL Editor**
3. cole o conteúdo de `supabase/god-money-schema-and-policies.sql`
4. execute
