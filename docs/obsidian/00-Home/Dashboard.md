# Dashboard — God Money

## Visão geral

- Nome do bot: **God Money**
- Canal principal: **Telegram**
- Hospedagem: **Render**
- Persistência: **Supabase**
- Fonte principal de notícias: **InfoMoney**

## Comandos principais

- `/start`
- `/menu`
- `/noticias`
- `/ibov`
- `/acao TICKER`
- `/agenda`
- `/resumo`

## Prioridades atuais

- [ ] subir no GitHub
- [ ] publicar no Render
- [ ] configurar variáveis de ambiente
- [ ] criar tabela no Supabase
- [ ] testar webhook do Telegram

## Arquitetura atual

- bot em Node.js
- cache de notícias no Supabase
- estratégia: **cache first, AI second**
- n8n para automações agendadas

## Links úteis

- Projeto local: `D:\jvictor doc\edicao\Antigravity\god-money-bot`
- Arquivo principal: `src/index.js`
- Deploy Render: `render.yaml`
- Documentação do projeto: `README.md`

## Documentos estratégicos

- `01-Estrategia/Plano-de-Produto.md`
- `01-Estrategia/Pricing-e-Monetizacao.md`
- `01-Estrategia/Funnel-de-Monetizacao.md`
- `05-Supabase/Schema-Produto-e-Monetizacao.md`
- `06-Operacao/Roadmap-Tecnico-e-Comercial.md`
