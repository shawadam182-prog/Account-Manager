import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { addAction } from '../../services/actionsService';
import { getAccounts } from '../../services/accountsService';
import type { ActionPriority, ActionCategory } from '../../lib/types';

const CATEGORY_OPTIONS: ActionCategory[] = ['Follow-up', 'Data request', 'Internal task', 'Client deliverable', 'Renewal', 'Other'];

export default function AddActionForm({
  accountId,
  meetingId,
  onSaved,
  onCancel,
}: {
  accountId: string | null;
  meetingId?: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('Millie');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<ActionPriority>('Medium');
  const [category, setCategory] = useState<ActionCategory | ''>('');
  const [notes, setNotes] = useState('');
  const [showExtra, setShowExtra] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountOptions, setAccountOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (accountId === null) {
      getAccounts().then((data) =>
        setAccountOptions(data.map((a) => ({ id: a.id, name: a.company_name })))
      );
    }
  }, [accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSaving(true);
    try {
      await addAction({
        account_id: accountId ?? selectedAccountId ?? null,
        meeting_id: meetingId || null,
        description: description.trim(),
        owner,
        due_date: dueDate || null,
        priority,
        category: category || null,
        notes: notes.trim() || null,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/80 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Plus size={14} className="text-brand-primary" />
          <span className="text-sm font-bold text-zinc-700">New Action</span>
        </div>
        <button type="button" onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 bg-transparent border-none cursor-pointer p-0.5">
          <X size={14} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Description */}
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What needs to be done?"
          required
          autoFocus
          className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all bg-white placeholder:text-zinc-400"
        />

        {/* Optional account selector (only when creating from ActionsHub) */}
        {accountId === null && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Link to Account (optional)</label>
            <select
              value={selectedAccountId ?? ''}
              onChange={(e) => setSelectedAccountId(e.target.value || null)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all w-fit max-w-xs"
            >
              <option value="">General (no account)</option>
              {accountOptions.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Main row: owner, priority, due date */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Owner</label>
            <select value={owner} onChange={e => setOwner(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all">
              <option value="Millie">Millie</option>
              <option value="Client">Client</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Priority</label>
            <div className="flex gap-1">
              {(['High', 'Medium', 'Low'] as ActionPriority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-2.5 py-2 text-[11px] font-bold rounded-lg border cursor-pointer transition-all ${
                    priority === p
                      ? p === 'High' ? 'bg-red-50 text-red-700 border-red-200'
                        : p === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-300'
                      : 'bg-white text-zinc-400 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Toggle extra fields */}
        {!showExtra && (
          <button
            type="button"
            onClick={() => setShowExtra(true)}
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover bg-transparent border-none cursor-pointer p-0 self-start"
          >
            + Add category & notes
          </button>
        )}

        {showExtra && (
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as ActionCategory)}
                className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all w-fit">
                <option value="">None</option>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Additional context..."
                rows={2}
                className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-sm text-zinc-700 outline-none bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none placeholder:text-zinc-400"
              />
            </div>
          </div>
        )}

        {/* Submit row */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-zinc-500 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover border-none rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : 'Create Action'}
          </button>
        </div>
      </div>
    </form>
  );
}
