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

export function formatWelcomeMessage(botName = 'God Money') {
  return [
    `💸 <b>Bem-vindo ao ${escapeHtml(botName)}!</b>`,
    '',
    'Eu sou seu bot para acompanhar notícias da bolsa de valores de forma rápida e simples.',
    'Aqui você acompanha ações, Ibovespa, agenda econômica e os principais destaques do mercado.',
    'Minha principal fonte de notícias é o InfoMoney.',
    '',
    '<b>Comandos disponíveis:</b>',
    '• /noticias — últimas notícias da bolsa',
    '• /ibov — resumo do Ibovespa',
    '• /acao TICKER — notícias de uma ação específica',
    '• /agenda — agenda econômica do dia',
    '• /resumo — resumo rápido do mercado',
    '',
    'Se quiser, comece agora com /noticias ou /resumo.',
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