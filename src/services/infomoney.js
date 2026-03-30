import * as cheerio from 'cheerio';
import { config } from '../config.js';
import { trimText } from '../utils/formatters.js';

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

    items.push({
      title,
      summary,
      url: href,
    });
  });

  return uniqueByUrl(items).slice(0, limit);
}

async function searchByQuery(query, limit = config.newsItemsLimit) {
  const url = `${config.infomoneySearchUrl}${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  return collectArticlesFromHtml(html, limit);
}

export async function getLatestNews({ topic = '', limit = config.newsItemsLimit } = {}) {
  if (topic?.trim()) {
    return searchByQuery(topic.trim(), limit);
  }

  const html = await fetchHtml(config.infomoneyMarketsUrl);
  return collectArticlesFromHtml(html, limit);
}

export async function getTickerNews(tickerOrCompany) {
  const query = tickerOrCompany?.trim();
  if (!query) return [];
  return searchByQuery(query, 3);
}

export async function getIbovSummary() {
  const items = await searchByQuery('ibovespa', 4);
  return {
    headline: 'Resumo do Ibovespa com base em notícias recentes',
    items,
    note: 'Resumo baseado em cobertura do InfoMoney. Não é cotação em tempo real.',
  };
}

export async function getEconomicAgenda() {
  return searchByQuery('agenda econômica mercado copom fed inflação payroll', 5);
}

export async function getMarketSummary() {
  const items = await searchByQuery('mercado ibovespa dólar juros bolsa', 4);
  return {
    title: 'Resumo rápido do mercado',
    highlights: items.map((item) => item.title),
    nextWatch: items[0]?.title || 'Acompanhe os próximos destaques do pregão.',
    items,
  };
}