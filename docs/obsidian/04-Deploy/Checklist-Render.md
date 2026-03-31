# Checklist de Deploy no Render

## Antes de subir

- [ ] projeto commitado
- [ ] repositório no GitHub criado
- [ ] `render.yaml` revisado
- [ ] `TELEGRAM_BOT_TOKEN` separado
- [ ] `BASE_URL` definida após criação do serviço

## Variáveis de ambiente

- `NODE_ENV=production`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `BASE_URL`
- `TELEGRAM_SECRET_PATH`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`

## Depois do deploy

- [ ] validar `/health`
- [ ] validar webhook
- [ ] testar `/start`
- [ ] testar `/noticias`
- [ ] testar `/resumo`
