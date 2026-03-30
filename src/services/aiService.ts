import { supabase } from '../lib/supabase';

export async function callAI(action: string, payload: object) {
  const { data, error } = await supabase.functions.invoke('ai-process', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
}
