import { supabase } from '../lib/supabase';
import type { Action } from '../lib/types';

export async function getAllOpenActions(): Promise<Action[]> {
  const { data, error } = await supabase
    .from('actions')
    .select('*, account:accounts(id, company_name)')
    .in('status', ['Open', 'Blocked'])
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

export async function updateAction(id: string, updates: Partial<Action>): Promise<void> {
  const { error } = await supabase
    .from('actions')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function addAction(action: {
  account_id: string | null;
  meeting_id?: string | null;
  description: string;
  owner: string;
  due_date?: string | null;
  status?: string;
  priority?: string;
  category?: string | null;
  notes?: string | null;
}): Promise<Action> {
  const { data, error } = await supabase
    .from('actions')
    .insert({ status: 'Open', priority: 'Medium', ...action })
    .select()
    .single();
  if (error) throw error;
  return data;
}
