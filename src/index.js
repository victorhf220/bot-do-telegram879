import express from 'express';
import { createBot } from './bot.js';
import { config, getWebhookPath, isProduction, validateConfig } from './config.js';

validateConfig();

const bot = createBot(config.telegramToken);
const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'god-money-bot' });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    bot: 'God Money',
    mode: config.baseUrl ? 'webhook' : 'polling',
  });
});

async function start() {
  if (config.baseUrl) {
    const webhookPath = getWebhookPath();
    app.use(await bot.createWebhook({ domain: config.baseUrl, path: webhookPath }));

    app.listen(config.port, () => {
      console.log(`God Money ouvindo em http://localhost:${config.port}`);
      console.log(`Webhook configurado em ${config.baseUrl}${webhookPath}`);
    });
    return;
  }

  if (isProduction()) {
    app.listen(config.port, () => {
      console.log(`God Money ouvindo em http://localhost:${config.port}`);
      console.log('BASE_URL não definida; webhook não foi ativado.');
    });
  }

  await bot.launch();
  console.log('God Money iniciado em modo polling.');
}

start().catch((error) => {
  console.error('Falha ao iniciar o God Money:', error);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    bot.stop(signal);
    process.exit(0);
  });
}