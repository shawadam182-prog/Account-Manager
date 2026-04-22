import { supabase } from '../lib/supabase';
import type { Meeting } from '../lib/types';

export async function getMeetingsForAccount(accountId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*, actions(*)')
    .eq('account_id', accountId)
    .order('meeting_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getRecentMeetings(days: number = 14): Promise<Meeting[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('meetings')
    .select('*, account:accounts(id, company_name)')
    .gte('meeting_date', since.toISOString().split('T')[0])
    .order('meeting_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
  const { data, error } = await supabase
    .from('meetings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addMeeting(meeting: Omit<Meeting, 'id' | 'created_at' | 'actions' | 'account'>): Promise<Meeting> {
  const { data, error } = await supabase
    .from('meetings')
    .insert(meeting)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMeeting(id: string): Promise<void> {
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
