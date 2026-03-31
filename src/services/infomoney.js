import * as cheerio from 'cheerio';
import { config } from '../config.js';
import { getCachedNews, upsertNewsCache } from './supabase.js';
import { hasSerperConfigured, searchWithSerper } from './serper.js';
import { trimText } from '../utils/formatters.js';

const MARKET_KEYWORDS = [
  'bolsa',
  'mercado',
  'ibovespa',
  'acao',
  'ações',
  'dólar',
  'juros',
  'copom',
  'fed',
  'inflação',
  'dividendo',
  'resultado',
  'vale3',
  'petr4',
  'b3sa3',
  'itub4',
];

const defaultHeaders = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

function withTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

function absoluteUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${config.infomoneyBaseUrl}${url}`;
  return `${config.infomoneyBaseUrl}/${url.replace(/^\/+/, '')}`;
}

function isValidArticleUrl(url) {
  return /^https:\/\/www\.infomoney\.com\.br\/.+/.test(url);
}

function uniqueByUrl(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function extractTicker(text = '') {
  const match = String(text).toUpperCase().match(/\b[A-Z]{4}[0-9]{1,2}\b/);
  return match?.[0] || '';
}

function extractKeywords(text = '', topicHint = '') {
  const source = `${text} ${topicHint}`.toLowerCase();
  return [...new Set(MARKET_KEYWORDS.filter((keyword) => source.includes(keyword)))];
}

function normalizeArticle(item, topicHint = '') {
  const mergedText = [item.title, item.summary, topicHint].filter(Boolean).join(' ');
  return {
    ...item,
    source: item.source || 'InfoMoney',
    topicHint,
    ticker: extractTicker(mergedText),
    keywords: extractKeywords(mergedText, topicHint),
  };
}

function mergePrioritizingNewest(primary = [], secondary = [], limit = config.newsItemsLimit) {
  return uniqueByUrl([...primary, ...secondary]).slice(0, limit);
}

async function getSerperFallback(query, limit = config.newsItemsLimit) {
  if (!hasSerperConfigured()) {
    return [];
  }

  try {
    const tunedQuery = query?.trim()
      ? `${query} site:infomoney.com.br mercado financeiro ações brasil`
      : 'site:infomoney.com.br mercado financeiro ações ibovespa brasil';
    return await searchWithSerper(tunedQuery, limit);
  } catch (error) {
    console.warn('Serper fallback indisponível:', error.message);
    return [];
  }
}

async function fetchHtml(url) {
  const timeout = withTimeout(config.infomoneyTimeoutMs);
  try {
    const response = await fetch(url, {
      headers: defaultHeaders,
      signal: timeout.signal,
    });

    if (!response.ok) {
      throw new Error(`InfoMoney respondeu com status ${response.status}.`);
    }

    return await response.text();
  } finally {
    timeout.clear();
  }
}

function isRateLimitError(error) {
  return /429|rate limit|too many/i.test(String(error?.message || error || ''));
}

function collectArticlesFromHtml(html, limit = config.newsItemsLimit) {
  const $ = cheerio.load(html);
  const items = [];

  $('a').each((_, element) => {
    const anchor = $(element);
    const href = absoluteUrl(anchor.attr('href'));
    const title = trimText(anchor.text(), 200);

    if (!isValidArticleUrl(href) || title.length < 12) {
      return;
    }

    const summary = trimText(
      anchor.closest('article, div, li, section').find('p').first().text(),
      220,
    );

    const publishedAt =
      anchor.closest('article, div, li, section').find('time').first().attr('datetime') ||
      trimText(anchor.closest('article, div, li, section').find('time').first().text(), 80);

    items.push({
      title,
      summary,
      url: href,
      publishedAt,
      source: 'InfoMoney',
    });
  });

  return uniqueByUrl(items).slice(0, limit);
}

async function searchByQuery(query, limit = config.newsItemsLimit) {
  const url = `${config.infomoneySearchUrl}${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  return collectArticlesFromHtml(html, limit).map((item) => normalizeArticle(item, query));
}

async function readMarketsPage(limit = config.newsItemsLimit) {
  const html = await fetchHtml(config.infomoneyMarketsUrl);
  return collectArticlesFromHtml(html, limit).map((item) => normalizeArticle(item, 'mercado'));
}

export async function getLatestNews({
  topic = '',
  limit = config.newsItemsLimit,
  forceRefresh = false,
} = {}) {
  const normalizedTopic = topic?.trim() || '';

  if (!forceRefresh) {
    const cached = await getCachedNews({ topic: normalizedTopic, limit });
    if (cached.length >= Math.min(limit, 3)) {
      return cached;
    }
  }

  let fresh = [];
  try {
    fresh = normalizedTopic
      ? await searchByQuery(normalizedTopic, limit)
      : await readMarketsPage(limit);
  } catch (error) {
    const fallbackCached = await getCachedNews({
      topic: normalizedTopic,
      limit,
      maxAgeMinutes: config.newsCacheFallbackTtlMinutes,
    });

    if (fallbackCached.length) {
      return fallbackCached;
    }

    if (isRateLimitError(error)) {
      console.warn('Fonte principal em rate limit; respondendo sem quebrar o bot.');
      return [];
    }

    console.warn('Falha ao buscar notícias na fonte principal:', error.message);
    return [];
  }

  let finalFresh = fresh;
  if (finalFresh.length < Math.min(limit, 3)) {
    const serperFallback = await getSerperFallback(normalizedTopic, limit);
    finalFresh = mergePrioritizingNewest(finalFresh, serperFallback, limit);
  }

  await upsertNewsCache(finalFresh);

  if (finalFresh.length) {
    const fallbackCached = await getCachedNews({
      topic: normalizedTopic,
      limit,
      maxAgeMinutes: config.newsCacheFallbackTtlMinutes,
    });
    return mergePrioritizingNewest(finalFresh, fallbackCached, limit);
  }

  return getCachedNews({
    topic: normalizedTopic,
    limit,
    maxAgeMinutes: config.newsCacheFallbackTtlMinutes,
  });
}

export async function getTickerNews(tickerOrCompany) {
  const query = tickerOrCompany?.trim();
  if (!query) return [];
  return getLatestNews({ topic: query, limit: 3 });
}

export async function getIbovSummary() {
  const items = await getLatestNews({ topic: 'ibovespa', limit: 4 });
  return {
    headline: 'Resumo do Ibovespa com base em notícias recentes',
    items,
    note: 'Resumo baseado em cobertura do InfoMoney. Não é cotação em tempo real.',
  };
}

export async function getEconomicAgenda() {
  return getLatestNews({ topic: 'agenda econômica mercado copom fed inflação payroll', limit: 5 });
}

export async function getMarketSummary() {
  const items = await getLatestNews({ topic: 'mercado ibovespa dólar juros bolsa', limit: 4 });
  return {
    title: 'Resumo rápido do mercado',
    highlights: items.map((item) => item.title),
    nextWatch: items[0]?.title || 'Acompanhe os próximos destaques do pregão.',
    items,
  };
}