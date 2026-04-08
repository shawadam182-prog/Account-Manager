import { useState } from 'react';
import { Phone, X } from 'lucide-react';
import { addContactAttempt } from '../../services/contactAttemptsService';
import type { ContactMethod, ContactOutcome } from '../../lib/types';

const METHOD_OPTIONS: ContactMethod[] = ['Phone Call', 'Email', 'LinkedIn', 'In Person', 'Other'];
const OUTCOME_OPTIONS: ContactOutcome[] = ['No Answer', 'Voicemail', 'Bounced', 'Replied', 'Connected', 'Other'];

export default function LogContactAttemptForm({
  accountId,
  accountName,
  onSaved,
  onCancel,
}: {
  accountId: string;
  accountName?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [attemptDate, setAttemptDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<ContactMethod>('Phone Call');
  const [outcome, setOutcome] = useState<ContactOutcome | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addContactAttempt({
        account_id: accountId,
        attempt_date: attemptDate,
        method,
        outcome: outcome || null,
        notes: notes.trim() || null,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/80 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-brand-primary" />
          <span className="text-sm font-bold text-zinc-700">
            Log Contact Attempt{accountName ? ` — ${accountName}` : ''}
          </span>
        </div>
        <button type="button" onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 bg-transparent border-none cursor-pointer p-0.5">
          <X size={14} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-end gap-2.5 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Date</label>
            <input
              type="date"
              value={attemptDate}
              onChange={e => setAttemptDate(e.target.value)}
              required
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Method</label>
            <select value={method} onChange={e => setMethod(e.target.value as ContactMethod)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all">
              {METHOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Outcome</label>
            <select value={outcome} onChange={e => setOutcome(e.target.value as ContactOutcome)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all">
              <option value="">None</option>
              {OUTCOME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-sm text-zinc-700 outline-none bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-zinc-500 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover border-none rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : 'Log Attempt'}
          </button>
        </div>
      </div>
    </form>
  );
}
