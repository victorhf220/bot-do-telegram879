import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeBaseUrl = (value) => (value ? value.replace(/\/$/, '') : '');

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  baseUrl: normalizeBaseUrl(process.env.BASE_URL),
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || 'godmonetbot',
  telegramSecretPath: process.env.TELEGRAM_SECRET_PATH || 'telegram/webhook',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseInteractionsTable:
    process.env.SUPABASE_TABLE_INTERACTIONS || 'bot_interactions',
  supabaseNewsCacheTable:
    process.env.SUPABASE_TABLE_NEWS_CACHE || 'news_cache',
  infomoneyBaseUrl:
    (process.env.INFOMONEY_BASE_URL || 'https://www.infomoney.com.br').replace(
      /\/$/,
      '',
    ),
  infomoneyMarketsUrl:
    process.env.INFOMONEY_MARKETS_URL || 'https://www.infomoney.com.br/mercados/',
  infomoneySearchUrl:
    process.env.INFOMONEY_SEARCH_URL || 'https://www.infomoney.com.br/?s=',
  infomoneyTimeoutMs: toNumber(process.env.INFOMONEY_TIMEOUT_MS, 15000),
  newsItemsLimit: toNumber(process.env.NEWS_ITEMS_LIMIT, 5),
  newsCacheTtlMinutes: toNumber(process.env.NEWS_CACHE_TTL_MINUTES, 30),
  newsCacheFallbackTtlMinutes: toNumber(
    process.env.NEWS_CACHE_FALLBACK_TTL_MINUTES,
    360,
  ),
  serperApiKey: process.env.SERPER_API_KEY || '',
  serperSearchEndpoint:
    process.env.SERPER_SEARCH_ENDPOINT || 'https://google.serper.dev/search',
  serperResultsLimit: toNumber(process.env.SERPER_RESULTS_LIMIT, 5),
};

export function validateConfig() {
  if (!config.telegramToken) {
    throw new Error('A variável TELEGRAM_BOT_TOKEN é obrigatória.');
  }
}

export function isProduction() {
  return config.nodeEnv === 'production';
}

export function getWebhookPath() {
  return `/${config.telegramSecretPath.replace(/^\//, '')}`;
}