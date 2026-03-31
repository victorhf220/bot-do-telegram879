import { config } from '../config.js';
import { trimText } from '../utils/formatters.js';

function looksLikeInfoMoney(url = '') {
  return /infomoney\.com\.br/i.test(url);
}

function absoluteSource(url = '') {
  if (looksLikeInfoMoney(url)) return 'InfoMoney';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Web';
  }
}

function normalizeOrganicResult(item, topicHint = '') {
  return {
    title: trimText(item?.title || 'Sem título', 200),
    summary: trimText(item?.snippet || item?.description || 'Sem resumo disponível.', 220),
    url: item?.link || '',
    source: absoluteSource(item?.link || ''),
    topicHint,
    ticker: '',
    keywords: [],
    publishedAt: '',
  };
}

export function hasSerperConfigured() {
  return Boolean(config.serperApiKey);
}

export async function searchWithSerper(query, limit = config.serperResultsLimit) {
  if (!hasSerperConfigured()) {
    return [];
  }

  const response = await fetch(config.serperSearchEndpoint, {
    method: 'POST',
    headers: {
      'X-API-KEY': config.serperApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      gl: 'br',
      hl: 'pt-br',
      num: limit,
      autocorrect: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper respondeu com status ${response.status}.`);
  }

  const json = await response.json();
  const organic = Array.isArray(json?.organic) ? json.organic : [];
  return organic
    .map((item) => normalizeOrganicResult(item, query))
    .filter((item) => item.url && item.title);
}