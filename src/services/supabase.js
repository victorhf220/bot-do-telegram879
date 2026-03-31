import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let supabase = null;
const memoryUsers = new Map();
const memoryWatchlists = new Map();

const PLAN_LIMITS = {
  free: { watchlist: 3 },
  pro: { watchlist: 15 },
  premium: { watchlist: 50 },
};

function normalizeTelegramUserId(value) {
  return String(value || '').trim();
}

function normalizeTicker(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function ensureMemoryUser({ telegramUserId, username = '', firstName = '' }) {
  const normalizedId = normalizeTelegramUserId(telegramUserId);
  const existing = memoryUsers.get(normalizedId);

  if (existing) {
    if (username && !existing.username) existing.username = username;
    if (firstName && !existing.first_name) existing.first_name = firstName;
    existing.last_seen_at = new Date().toISOString();
    return existing;
  }

  const created = {
    id: normalizedId,
    telegram_user_id: normalizedId,
    username,
    first_name: firstName,
    profile_type: 'geral',
    plan: 'free',
    status: 'active',
    created_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };

  memoryUsers.set(normalizedId, created);
  return created;
}

function getMemoryWatchlist(telegramUserId) {
  const normalizedId = normalizeTelegramUserId(telegramUserId);
  return [...(memoryWatchlists.get(normalizedId) || [])];
}

function mapCachedRow(row) {
  return {
    title: row.title,
    summary: row.summary,
    url: row.url,
    source: row.source || 'InfoMoney',
    ticker: row.ticker || '',
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    topicHint: row.topic_hint || '',
    publishedAt: row.published_at || row.fetched_at || '',
    fetchedAt: row.fetched_at || '',
  };
}

function uniqueByUrl(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function buildSearchableText(item) {
  return [
    item.title,
    item.summary,
    item.url,
    item.ticker,
    item.topicHint,
    ...(item.keywords || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function getPlanLimits(plan = 'free') {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function getSupabase() {
  if (supabase) return supabase;

  const key = config.supabaseServiceRoleKey || config.supabaseAnonKey;
  if (!config.supabaseUrl || !key) {
    return null;
  }

  supabase = createClient(config.supabaseUrl, key, {
    auth: { persistSession: false },
  });

  return supabase;
}

export async function saveInteraction(payload) {
  const client = getSupabase();
  if (!client) return;

  try {
    await client.from(config.supabaseInteractionsTable).insert(payload);
  } catch (error) {
    console.warn('Não foi possível salvar interação no Supabase:', error.message);
  }
}

export async function getOrCreateUser({ telegramUserId, username = '', firstName = '' }) {
  const normalizedId = normalizeTelegramUserId(telegramUserId);
  const client = getSupabase();

  if (!client) {
    return ensureMemoryUser({ telegramUserId: normalizedId, username, firstName });
  }

  try {
    const payload = {
      telegram_user_id: normalizedId,
      username,
      first_name: firstName,
      last_seen_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('users')
      .upsert(payload, { onConflict: 'telegram_user_id' })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Não foi possível persistir usuário no Supabase:', error.message);
    return ensureMemoryUser({ telegramUserId: normalizedId, username, firstName });
  }
}

export async function updateUserProfileType({ telegramUserId, profileType }) {
  const normalizedId = normalizeTelegramUserId(telegramUserId);
  const normalizedProfile = String(profileType || 'geral').trim().toLowerCase();
  const client = getSupabase();

  if (!client) {
    const user = ensureMemoryUser({ telegramUserId: normalizedId });
    user.profile_type = normalizedProfile;
    return user;
  }

  try {
    const { data, error } = await client
      .from('users')
      .update({ profile_type: normalizedProfile, last_seen_at: new Date().toISOString() })
      .eq('telegram_user_id', normalizedId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Não foi possível atualizar o perfil do usuário:', error.message);
    const user = ensureMemoryUser({ telegramUserId: normalizedId });
    user.profile_type = normalizedProfile;
    return user;
  }
}

export async function getUserWatchlist({ telegramUserId }) {
  const normalizedId = normalizeTelegramUserId(telegramUserId);
  const client = getSupabase();

  if (!client) {
    return getMemoryWatchlist(normalizedId);
  }

  try {
    const user = await getOrCreateUser({ telegramUserId: normalizedId });
    const { data, error } = await client
      .from('watchlists')
      .select('ticker')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((item) => normalizeTicker(item.ticker)).filter(Boolean);
  } catch (error) {
    console.warn('Não foi possível consultar a watchlist no Supabase:', error.message);
    return getMemoryWatchlist(normalizedId);
  }
}

export async function addTickerToWatchlist({ telegramUserId, ticker, plan = 'free' }) {
  const normalizedId = normalizeTelegramUserId(telegramUserId);
  const normalizedTicker = normalizeTicker(ticker);
  const limit = getPlanLimits(plan).watchlist;

  if (!normalizedTicker) {
    return { added: false, reason: 'invalid_ticker' };
  }

  const current = await getUserWatchlist({ telegramUserId: normalizedId });
  if (current.includes(normalizedTicker)) {
    return { added: false, reason: 'already_exists', watchlist: current, limit };
  }

  if (current.length >= limit) {
    return { added: false, reason: 'limit_reached', watchlist: current, limit };
  }

  const client = getSupabase();
  if (!client) {
    const updated = [...current, normalizedTicker];
    memoryWatchlists.set(normalizedId, updated);
    ensureMemoryUser({ telegramUserId: normalizedId });
    return { added: true, ticker: normalizedTicker, watchlist: updated, limit };
  }

  try {
    const user = await getOrCreateUser({ telegramUserId: normalizedId });
    const { error } = await client.from('watchlists').insert({
      user_id: user.id,
      ticker: normalizedTicker,
    });

    if (error) throw error;

    const watchlist = await getUserWatchlist({ telegramUserId: normalizedId });
    return { added: true, ticker: normalizedTicker, watchlist, limit };
  } catch (error) {
    console.warn('Não foi possível adicionar ticker na watchlist:', error.message);
    const updated = [...current, normalizedTicker];
    memoryWatchlists.set(normalizedId, updated);
    return { added: true, ticker: normalizedTicker, watchlist: updated, limit };
  }
}

export async function removeTickerFromWatchlist({ telegramUserId, ticker }) {
  const normalizedId = normalizeTelegramUserId(telegramUserId);
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) {
    return { removed: false, reason: 'invalid_ticker', watchlist: await getUserWatchlist({ telegramUserId: normalizedId }) };
  }

  const current = await getUserWatchlist({ telegramUserId: normalizedId });
  if (!current.includes(normalizedTicker)) {
    return { removed: false, reason: 'not_found', watchlist: current };
  }

  const client = getSupabase();
  if (!client) {
    const updated = current.filter((item) => item !== normalizedTicker);
    memoryWatchlists.set(normalizedId, updated);
    return { removed: true, ticker: normalizedTicker, watchlist: updated };
  }

  try {
    const user = await getOrCreateUser({ telegramUserId: normalizedId });
    const { error } = await client
      .from('watchlists')
      .delete()
      .eq('user_id', user.id)
      .eq('ticker', normalizedTicker);

    if (error) throw error;
    const watchlist = await getUserWatchlist({ telegramUserId: normalizedId });
    return { removed: true, ticker: normalizedTicker, watchlist };
  } catch (error) {
    console.warn('Não foi possível remover ticker da watchlist:', error.message);
    const updated = current.filter((item) => item !== normalizedTicker);
    memoryWatchlists.set(normalizedId, updated);
    return { removed: true, ticker: normalizedTicker, watchlist: updated };
  }
}

export async function upsertNewsCache(items = []) {
  const client = getSupabase();
  if (!client || !items.length) return;

  const payload = items
    .filter((item) => item?.url && item?.title)
    .map((item) => ({
      url: item.url,
      title: item.title,
      summary: item.summary || '',
      source: item.source || 'InfoMoney',
      ticker: item.ticker || null,
      keywords: Array.isArray(item.keywords) ? item.keywords : [],
      topic_hint: item.topicHint || null,
      published_at: item.publishedAt || null,
      fetched_at: new Date().toISOString(),
    }));

  if (!payload.length) return;

  try {
    await client
      .from(config.supabaseNewsCacheTable)
      .upsert(payload, { onConflict: 'url' });
  } catch (error) {
    console.warn('Não foi possível atualizar o cache de notícias no Supabase:', error.message);
  }
}

export async function getCachedNews({
  topic = '',
  limit = config.newsItemsLimit,
  maxAgeMinutes = config.newsCacheTtlMinutes,
} = {}) {
  const client = getSupabase();
  if (!client) return [];

  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();

  try {
    const { data, error } = await client
      .from(config.supabaseNewsCacheTable)
      .select('*')
      .gte('fetched_at', cutoff)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('fetched_at', { ascending: false })
      .limit(Math.max(limit * 10, 30));

    if (error) throw error;

    const rows = uniqueByUrl((data || []).map(mapCachedRow));
    if (!topic?.trim()) {
      return rows.slice(0, limit);
    }

    const query = topic.trim().toLowerCase();
    const filtered = rows.filter((item) => buildSearchableText(item).includes(query));
    return filtered.slice(0, limit);
  } catch (error) {
    console.warn('Não foi possível consultar o cache de notícias no Supabase:', error.message);
    return [];
  }
}