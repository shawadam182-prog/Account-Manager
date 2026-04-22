import { supabase } from '../lib/supabase';

export async function callAI(action: string, payload: object) {
  const { data, error } = await supabase.functions.invoke('ai-process', {
    body: { action, payload },
  });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.text === 'function') {
      try {
        const body = await ctx.text();
        try {
          const parsed = JSON.parse(body);
          if (parsed?.error) {
            const msg = String(parsed.error);
            if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
              throw new Error('Gemini API quota exceeded. Wait a minute or check your Gemini API key limits.');
            }
            throw new Error(msg);
          }
        } catch {
          if (body) throw new Error(body);
        }
      } catch (inner) {
        if (inner instanceof Error) throw inner;
      }
    }
    throw error;
  }
  return data;
}
