import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let supabase = null;

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