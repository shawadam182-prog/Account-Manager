import { supabase } from '../lib/supabase';
import type { Account } from '../lib/types';

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts_with_stats')
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

export async function addAccount(account: {
  company_name: string;
  membership_level?: string | null;
  main_poc?: string | null;
  renewal_month?: string | null;
  reporting_period?: string | null;
  industry?: string | null;
  rag_status?: string | null;
  parent_account_id?: string | null;
}): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert(account)
    .select()
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
