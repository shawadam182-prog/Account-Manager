import { supabase } from '../lib/supabase';
import type { Action } from '../lib/types';

export async function getAllOpenActions(): Promise<Action[]> {
  const { data, error } = await supabase
    .from('actions')
    .select('*, account:accounts(id, company_name)')
    .eq('status', 'Open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllActions(): Promise<Action[]> {
  const { data, error } = await supabase
    .from('actions')
    .select('*, account:accounts(id, company_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getActionsForAccount(accountId: string): Promise<Action[]> {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateActionStatus(id: string, status: 'Open' | 'Done' | 'Blocked'): Promise<void> {
  const { error } = await supabase
    .from('actions')
    .update({ status, completed_at: status === 'Done' ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw error;
}

export async function addAction(action: Omit<Action, 'id' | 'created_at' | 'account'>): Promise<Action> {
  const { data, error } = await supabase
    .from('actions')
    .insert(action)
    .select()
    .single();
  if (error) throw error;
  return data;
}
