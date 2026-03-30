import { Telegraf } from 'telegraf';
import {
  getEconomicAgenda,
  getIbovSummary,
  getLatestNews,
  getMarketSummary,
  getTickerNews,
} from './services/infomoney.js';
import { saveInteraction } from './services/supabase.js';
import {
  formatArticleList,
  formatMarketBriefing,
  formatMenuMessage,
  formatWelcomeMessage,
} from './utils/formatters.js';

const BOT_NAME = 'God Money';

const BOT_COMMANDS = [
  { command: 'start', description: 'Iniciar e ver os comandos' },
  { command: 'menu', description: 'Mostrar menu de comandos' },
  { command: 'noticias', description: 'Últimas notícias da bolsa' },
  { command: 'ibov', description: 'Resumo do Ibovespa' },
  { command: 'acao', description: 'Notícias de uma ação' },
  { command: 'agenda', description: 'Agenda econômica do dia' },
  { command: 'resumo', description: 'Resumo rápido do mercado' },
];

async function replyAndLog(ctx, {
  command,
  message,
  source = 'InfoMoney',
  status = 'ok',
  parseMode = 'HTML',
}) {
  await ctx.reply(message, {
    parse_mode: parseMode,
    disable_web_page_preview: false,
  });

  await saveInteraction({
    chat_id: String(ctx.chat?.id ?? ''),
    user_id: String(ctx.from?.id ?? ''),
    username: ctx.from?.username ?? '',
    command,
    input: ctx.message?.text ?? '',
    response_preview: message.slice(0, 250),
    source,
    status,
  });
}

function extractCommandArgument(text = '') {
  const parts = text.trim().split(/\s+/);
  return parts.slice(1).join(' ').trim();
}

export function createBot(token) {
  const bot = new Telegraf(token);

  bot.catch(async (error, ctx) => {
    console.error('Erro do bot:', error);

    try {
      await saveInteraction({
        chat_id: String(ctx.chat?.id ?? ''),
        user_id: String(ctx.from?.id ?? ''),
        username: ctx.from?.username ?? '',
        command: 'error',
        input: ctx.message?.text ?? '',
        response_preview: error.message?.slice(0, 250) ?? 'Erro interno',
        source: 'system',
        status: 'error',
      });
    } catch {
      // noop
    }
  });

  bot.start(async (ctx) => {
    await replyAndLog(ctx, {
      command: '/start',
      message: formatWelcomeMessage(BOT_NAME),
      source: 'system',
    });
  });

  bot.command('menu', async (ctx) => {
    await replyAndLog(ctx, {
      command: '/menu',
      message: formatMenuMessage(),
      source: 'system',
    });
  });

  bot.command('noticias', async (ctx) => {
    const topic = extractCommandArgument(ctx.message?.text);
    const news = await getLatestNews({ topic });
    const title = topic ? `📈 <b>Notícias sobre ${topic}</b>` : '📈 <b>Últimas notícias da bolsa</b>';
    const body = formatArticleList(news);

    await replyAndLog(ctx, {
      command: '/noticias',
      message: `${title}\n\n${body}`,
    });
  });

  bot.command('ibov', async (ctx) => {
    const result = await getIbovSummary();
    const body = formatArticleList(result.items);

    await replyAndLog(ctx, {
      command: '/ibov',
      message: `📊 <b>${result.headline}</b>\n${result.note}\n\n${body}`,
    });
  });

  bot.command('acao', async (ctx) => {
    const query = extractCommandArgument(ctx.message?.text);
    if (!query) {
      await replyAndLog(ctx, {
        command: '/acao',
        message: 'Me diga o ticker ou nome da empresa. Ex.: <code>/acao petr4</code>',
        source: 'system',
      });
      return;
    }

    const news = await getTickerNews(query);
    const body = formatArticleList(news);

    await replyAndLog(ctx, {
      command: '/acao',
      message: `🏷️ <b>Notícias sobre ${query}</b>\n\n${body}`,
    });
  });

  bot.command('agenda', async (ctx) => {
    const news = await getEconomicAgenda();
    const body = formatArticleList(news);

    await replyAndLog(ctx, {
      command: '/agenda',
      message: `🗓️ <b>Agenda econômica e de mercado</b>\n\n${body}`,
    });
  });

  bot.command('resumo', async (ctx) => {
    const summary = await getMarketSummary();
    const message = formatMarketBriefing(summary);

    await replyAndLog(ctx, {
      command: '/resumo',
      message,
    });
  });

  bot.on('text', async (ctx, next) => {
    const text = ctx.message?.text?.trim() ?? '';
    if (text.startsWith('/')) {
      return next();
    }

    await replyAndLog(ctx, {
      command: 'fallback',
      message:
        'Use /menu para ver os comandos disponíveis. Se quiser, comece com /noticias ou /resumo.',
      source: 'system',
    });
  });

  bot.telegram.setMyCommands(BOT_COMMANDS).catch((error) => {
    console.warn('Não foi possível publicar os comandos do bot:', error.message);
  });

  bot.telegram
    .setMyName(BOT_NAME)
    .catch((error) => console.warn('Não foi possível definir o nome do bot:', error.message));

  bot.telegram
    .setMyDescription(
      '💸 Bem-vindo ao God Money! Bot para acompanhar notícias da bolsa, ações, Ibovespa e agenda econômica.',
    )
    .catch((error) =>
      console.warn('Não foi possível definir a descrição do bot:', error.message),
    );

  bot.telegram
    .setMyShortDescription('Notícias da bolsa e do mercado financeiro.')
    .catch((error) =>
      console.warn('Não foi possível definir a short description do bot:', error.message),
    );

  return bot;
}