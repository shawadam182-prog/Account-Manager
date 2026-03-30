import { supabase } from '../lib/supabase';
import type { Account } from '../lib/types';

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('company_name');
  if (error) throw error;
  return data;
}

export async function getAccount(id: string): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
