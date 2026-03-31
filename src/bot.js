import { Telegraf } from 'telegraf';
import {
  getEconomicAgenda,
  getIbovSummary,
  getLatestNews,
  getMarketSummary,
  getTickerNews,
} from './services/infomoney.js';
import {
  addTickerToWatchlist,
  getOrCreateUser,
  getPlanLimits,
  getUserWatchlist,
  removeTickerFromWatchlist,
  saveInteraction,
  updateUserProfileType,
} from './services/supabase.js';
import {
  formatArticleList,
  formatMarketBriefing,
  formatMenuMessage,
  formatPlanMessage,
  formatProfileMessage,
  formatRadarMessage,
  formatUpgradeMessage,
  formatWelcomeMessage,
  formatWatchlistMessage,
} from './utils/formatters.js';

const BOT_NAME = 'God Money';
const PROFILE_OPTIONS = new Set([
  'geral',
  'executivo',
  'trader',
  'patrimonial',
  'longo_prazo',
]);

const BOT_COMMANDS = [
  { command: 'start', description: 'Iniciar e ver os comandos' },
  { command: 'menu', description: 'Mostrar menu de comandos' },
  { command: 'noticias', description: 'Últimas notícias da bolsa' },
  { command: 'ibov', description: 'Resumo do Ibovespa' },
  { command: 'acao', description: 'Notícias de uma ação' },
  { command: 'agenda', description: 'Agenda econômica do dia' },
  { command: 'resumo', description: 'Resumo rápido do mercado' },
  { command: 'perfil', description: 'Define seu perfil de leitura' },
  { command: 'watchlist', description: 'Gerencia seus ativos' },
  { command: 'radar', description: 'Radar baseado na watchlist' },
  { command: 'plano', description: 'Mostra plano e limites' },
  { command: 'upgrade', description: 'Mostra recursos premium' },
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

function normalizeProfileInput(value = '') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (normalized === 'empresario') return 'executivo';
  if (normalized === 'milionario') return 'patrimonial';
  if (PROFILE_OPTIONS.has(normalized)) return normalized;
  return '';
}

function normalizeTicker(value = '') {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

async function getUserState(ctx) {
  return getOrCreateUser({
    telegramUserId: ctx.from?.id,
    username: ctx.from?.username,
    firstName: ctx.from?.first_name,
  });
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
    const user = await getUserState(ctx);
    const watchlist = await getUserWatchlist({ telegramUserId: user.telegram_user_id });

    await replyAndLog(ctx, {
      command: '/start',
      message: formatWelcomeMessage(BOT_NAME, {
        firstName: user.first_name,
        profileType: user.profile_type,
        plan: user.plan,
        watchlistCount: watchlist.length,
      }),
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

  bot.command('perfil', async (ctx) => {
    const user = await getUserState(ctx);
    const requestedProfile = normalizeProfileInput(extractCommandArgument(ctx.message?.text));

    if (!requestedProfile) {
      await replyAndLog(ctx, {
        command: '/perfil',
        message: [
          '🧭 <b>Escolha seu perfil</b>',
          '',
          'Use:',
          '• <code>/perfil geral</code>',
          '• <code>/perfil executivo</code>',
          '• <code>/perfil trader</code>',
          '• <code>/perfil patrimonial</code>',
          '• <code>/perfil longo_prazo</code>',
        ].join('\n'),
        source: 'system',
      });
      return;
    }

    const updatedUser = await updateUserProfileType({
      telegramUserId: user.telegram_user_id,
      profileType: requestedProfile,
    });

    await replyAndLog(ctx, {
      command: '/perfil',
      message: formatProfileMessage(updatedUser),
      source: 'system',
    });
  });

  bot.command('watchlist', async (ctx) => {
    const user = await getUserState(ctx);
    const args = extractCommandArgument(ctx.message?.text);
    const [actionRaw, tickerRaw = ''] = args.split(/\s+/, 2);
    const action = (actionRaw || 'list').toLowerCase();
    const ticker = normalizeTicker(tickerRaw);
    const limits = getPlanLimits(user.plan);

    if (!args || action === 'list') {
      const watchlist = await getUserWatchlist({ telegramUserId: user.telegram_user_id });
      await replyAndLog(ctx, {
        command: '/watchlist',
        message: formatWatchlistMessage({ watchlist, limit: limits.watchlist }),
        source: 'system',
      });
      return;
    }

    if (action === 'add') {
      const result = await addTickerToWatchlist({
        telegramUserId: user.telegram_user_id,
        ticker,
        plan: user.plan,
      });

      const reasonMap = {
        invalid_ticker: 'Ticker inválido. Ex.: <code>/watchlist add PETR4</code>',
        already_exists: 'Esse ativo já está na sua watchlist.',
        limit_reached:
          'Você atingiu o limite da sua watchlist atual. Use <code>/upgrade</code> para ampliar.',
      };

      const extra = result.reason ? `${reasonMap[result.reason]}\n\n` : `✅ <b>${ticker}</b> adicionado à sua watchlist.\n\n`;
      await replyAndLog(ctx, {
        command: '/watchlist',
        message: `${extra}${formatWatchlistMessage({
          watchlist: result.watchlist || [],
          limit: result.limit || limits.watchlist,
        })}`,
        source: 'system',
      });
      return;
    }

    if (action === 'remove') {
      const result = await removeTickerFromWatchlist({
        telegramUserId: user.telegram_user_id,
        ticker,
      });

      const prefix = result.removed
        ? `🗑️ <b>${ticker}</b> removido da sua watchlist.\n\n`
        : 'Esse ativo não estava na sua watchlist.\n\n';

      await replyAndLog(ctx, {
        command: '/watchlist',
        message: `${prefix}${formatWatchlistMessage({
          watchlist: result.watchlist || [],
          limit: limits.watchlist,
        })}`,
        source: 'system',
      });
      return;
    }

    await replyAndLog(ctx, {
      command: '/watchlist',
      message:
        'Use <code>/watchlist list</code>, <code>/watchlist add PETR4</code> ou <code>/watchlist remove PETR4</code>.',
      source: 'system',
    });
  });

  bot.command('plano', async (ctx) => {
    const user = await getUserState(ctx);
    await replyAndLog(ctx, {
      command: '/plano',
      message: formatPlanMessage({ plan: user.plan, limits: getPlanLimits(user.plan) }),
      source: 'system',
    });
  });

  bot.command('upgrade', async (ctx) => {
    await replyAndLog(ctx, {
      command: '/upgrade',
      message: formatUpgradeMessage(),
      source: 'system',
    });
  });

  bot.command('radar', async (ctx) => {
    const user = await getUserState(ctx);
    const watchlist = await getUserWatchlist({ telegramUserId: user.telegram_user_id });

    if (!watchlist.length) {
      await replyAndLog(ctx, {
        command: '/radar',
        message:
          'Você ainda não montou sua watchlist. Comece com <code>/watchlist add VALE3</code> e depois use <code>/radar</code>.',
        source: 'system',
      });
      return;
    }

    const cappedWatchlist = watchlist.slice(0, Math.min(getPlanLimits(user.plan).watchlist, 8));
    const [marketSummary, ...tickerNews] = await Promise.all([
      getMarketSummary(),
      ...cappedWatchlist.map((ticker) => getTickerNews(ticker)),
    ]);

    const entries = cappedWatchlist
      .map((ticker, index) => ({ ticker, items: tickerNews[index] || [] }))
      .filter((entry) => entry.items.length);

    await replyAndLog(ctx, {
      command: '/radar',
      message: formatRadarMessage({ user, entries, marketSummary }),
      source: 'InfoMoney',
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
    const user = await getUserState(ctx);
    const watchlist = await getUserWatchlist({ telegramUserId: user.telegram_user_id });
    const summary = await getMarketSummary();
    const enrichedSummary = {
      ...summary,
      nextWatch:
        watchlist.length > 0
          ? `Observe especialmente: ${watchlist.slice(0, 3).join(', ')}`
          : summary.nextWatch,
    };
    const message = formatMarketBriefing(enrichedSummary);

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