export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function trimText(text = '', max = 280) {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

const PROFILE_LABELS = {
  geral: 'Geral',
  executivo: 'Executivo',
  trader: 'Trader',
  patrimonial: 'Patrimonial',
  longo_prazo: 'Longo prazo',
};

export function getProfileLabel(profileType = 'geral') {
  return PROFILE_LABELS[profileType] || PROFILE_LABELS.geral;
}

export function formatArticleList(items = [], sourceLabel = 'InfoMoney') {
  if (!items.length) {
    return 'Não encontrei notícias relevantes agora. Tente novamente em instantes.';
  }

  const body = items
    .map((item, index) => {
      const title = escapeHtml(item.title || 'Sem título');
      const summary = escapeHtml(trimText(item.summary || 'Sem resumo disponível.', 180));
      const url = item.url || '#';
      return `${index + 1}. <b>${title}</b>\n${summary}\n${url}`;
    })
    .join('\n\n');

  return `${body}\n\nFonte: ${sourceLabel}`;
}

export function formatWelcomeMessage(
  botName = 'God Money',
  { firstName = '', profileType = 'geral', plan = 'free', watchlistCount = 0 } = {},
) {
  const profile = getProfileLabel(profileType);
  const greeting = firstName ? `, ${escapeHtml(firstName)}` : '';
  return [
    `💸 <b>Bem-vindo ao ${escapeHtml(botName)}${greeting}!</b>`,
    '',
    'Eu sou seu bot para acompanhar notícias da bolsa de valores de forma rápida, estratégica e personalizada.',
    'Aqui você acompanha ações, Ibovespa, agenda econômica, watchlist e os principais destaques do mercado.',
    'Minha principal fonte de notícias é o InfoMoney.',
    '',
    `<b>Seu perfil atual:</b> ${escapeHtml(profile)}`,
    `<b>Seu plano atual:</b> ${escapeHtml(String(plan).toUpperCase())}`,
    `<b>Ativos na watchlist:</b> ${watchlistCount}`,
    '',
    '<b>Comandos disponíveis:</b>',
    '• /noticias — últimas notícias da bolsa',
    '• /ibov — resumo do Ibovespa',
    '• /acao TICKER — notícias de uma ação específica',
    '• /agenda — agenda econômica do dia',
    '• /resumo — resumo rápido do mercado',
    '• /perfil — define seu estilo de leitura do mercado',
    '• /watchlist — gerencia seus ativos acompanhados',
    '• /radar — briefing com base na sua watchlist',
    '• /plano — mostra seus limites e recursos',
    '• /upgrade — mostra os recursos premium',
    '',
    'Se quiser, comece com /perfil executivo e depois /watchlist add VALE3.',
  ].join('\n');
}

export function formatMenuMessage() {
  return [
    '📌 <b>Menu God Money</b>',
    '',
    '• /noticias',
    '• /ibov',
    '• /acao TICKER',
    '• /agenda',
    '• /resumo',
    '• /perfil [geral|executivo|trader|patrimonial|longo_prazo]',
    '• /watchlist list',
    '• /watchlist add PETR4',
    '• /watchlist remove PETR4',
    '• /radar',
    '• /plano',
    '• /upgrade',
  ].join('\n');
}

export function formatMarketBriefing({
  title = 'Resumo do mercado',
  highlights = [],
  nextWatch = '',
}) {
  const lines = [`📊 <b>${escapeHtml(title)}</b>`, ''];

  if (highlights.length) {
    lines.push('<b>Destaques:</b>');
    for (const item of highlights) {
      lines.push(`• ${escapeHtml(trimText(item, 160))}`);
    }
    lines.push('');
  }

  if (nextWatch) {
    lines.push(`<b>Próximo ponto de atenção:</b> ${escapeHtml(nextWatch)}`);
  }

  lines.push('', 'Fonte: InfoMoney');
  return lines.join('\n');
}

export function formatProfileMessage(user) {
  return [
    '🧭 <b>Perfil atualizado</b>',
    '',
    `Seu perfil agora é: <b>${escapeHtml(getProfileLabel(user.profile_type))}</b>`,
    '',
    'Perfis disponíveis:',
    '• geral',
    '• executivo',
    '• trader',
    '• patrimonial',
    '• longo_prazo',
  ].join('\n');
}

export function formatWatchlistMessage({ watchlist = [], limit = 3 }) {
  const content = watchlist.length
    ? watchlist.map((ticker, index) => `${index + 1}. <b>${escapeHtml(ticker)}</b>`).join('\n')
    : 'Sua watchlist está vazia. Use <code>/watchlist add PETR4</code>.';

  return [
    '📌 <b>Sua watchlist</b>',
    '',
    content,
    '',
    `Limite do seu plano atual: <b>${limit}</b> ativos`,
  ].join('\n');
}

export function formatPlanMessage({ plan = 'free', limits = { watchlist: 3 } } = {}) {
  return [
    '💼 <b>Plano atual</b>',
    '',
    `Plano: <b>${escapeHtml(String(plan).toUpperCase())}</b>`,
    `Limite de watchlist: <b>${limits.watchlist}</b> ativos`,
    '',
    '<b>Estrutura sugerida:</b>',
    '• Free — até 3 ativos e resumos básicos',
    '• Pro — mais ativos, alertas e feed personalizado',
    '• Premium — radar executivo, alertas avançados e análise premium',
  ].join('\n');
}

export function formatUpgradeMessage() {
  return [
    '🚀 <b>Upgrade God Money</b>',
    '',
    'Para investidores de alto nível, o valor está em velocidade, personalização e filtro de ruído.',
    '',
    '<b>No plano Pro/Premium você pode destravar:</b>',
    '• watchlist maior',
    '• radar personalizado por carteira',
    '• alertas por ativo e evento',
    '• feed orientado por perfil',
    '• análises premium e contexto mais estratégico',
  ].join('\n');
}

export function formatRadarMessage({ user, entries = [], marketSummary }) {
  const profileLabel = getProfileLabel(user?.profile_type);

  const blocks = entries.map((entry) => {
    const headlines = entry.items
      .slice(0, 2)
      .map((item) => `• ${escapeHtml(trimText(item.title, 120))}`)
      .join('\n');

    return `<b>${escapeHtml(entry.ticker)}</b>\n${headlines}`;
  });

  const summaryHighlights = (marketSummary?.highlights || [])
    .slice(0, 2)
    .map((item) => `• ${escapeHtml(trimText(item, 120))}`)
    .join('\n');

  return [
    '🎯 <b>Radar personalizado</b>',
    '',
    `Perfil: <b>${escapeHtml(profileLabel)}</b>`,
    `Plano: <b>${escapeHtml(String(user?.plan || 'free').toUpperCase())}</b>`,
    '',
    '<b>Mercado:</b>',
    summaryHighlights || '• Sem destaques gerais disponíveis agora.',
    '',
    '<b>Watchlist:</b>',
    blocks.join('\n\n') || 'Sem notícias relevantes para sua watchlist no momento.',
    '',
    'Fonte: InfoMoney',
  ].join('\n');
}