# n8n — Resumo diário da bolsa

## Objetivo

Enviar automaticamente no Telegram um resumo com notícias da bolsa usando **InfoMoney**.

## Arquivo do workflow

O workflow foi salvo em:

```text
n8n/god-money-resumo-diario.json
```

## O que o fluxo faz

1. roda em horários fixos de segunda a sexta
2. lê o feed do InfoMoney
3. filtra notícias ligadas a bolsa/mercado
4. monta uma mensagem curta
5. envia no Telegram

## Horários atuais

- 08:30
- 18:30
- dias úteis

## Nós usados

- Schedule Trigger
- Set
- RSS Read
- Code
- Telegram

## O que configurar no n8n

### 1. Credencial do Telegram

No node `Enviar no Telegram`, selecione sua credencial Telegram.

### 2. Chat ID

No node `Config`, troque:

```text
COLOQUE_AQUI_O_CHAT_ID
```

pelo ID do chat/canal/grupo que vai receber as mensagens.

### 3. Feed URL

Por padrão o fluxo usa:

```text
https://www.infomoney.com.br/feed/
```

Se quiser, depois você pode trocar por outro feed mais específico.

## Como importar

1. abra o n8n
2. escolha **Import from file**
3. selecione `n8n/god-money-resumo-diario.json`
4. configure a credencial Telegram
5. ajuste o `chat_id`
6. salve e ative o workflow

## Melhorias futuras

- salvar os envios no Supabase
- separar pré-mercado e pós-mercado
- mandar resumo por watchlist
- criar fluxo adicional para agenda econômica
