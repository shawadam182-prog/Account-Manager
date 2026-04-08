import { supabase } from '../lib/supabase';
import type { ContactAttempt } from '../lib/types';

export async function getAllContactAttempts(): Promise<ContactAttempt[]> {
  const { data, error } = await supabase
    .from('contact_attempts')
    .select('*, account:accounts(id, company_name)')
    .order('attempt_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getContactAttemptsForAccount(accountId: string): Promise<ContactAttempt[]> {
  const { data, error } = await supabase
    .from('contact_attempts')
    .select('*')
    .eq('account_id', accountId)
    .order('attempt_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addContactAttempt(attempt: {
  account_id: string;
  attempt_date: string;
  method: string;
  outcome?: string | null;
  notes?: string | null;
}): Promise<ContactAttempt> {
  const { data, error } = await supabase
    .from('contact_attempts')
    .insert(attempt)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContactAttempt(id: string): Promise<void> {
  const { error } = await supabase
    .from('contact_attempts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
