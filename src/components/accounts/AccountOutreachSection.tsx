import { useEffect, useState } from 'react';
import { Phone, Plus, Trash2 } from 'lucide-react';
import type { ContactAttempt } from '../../lib/types';
import { getContactAttemptsForAccount, deleteContactAttempt } from '../../services/contactAttemptsService';
import LogContactAttemptForm from './LogContactAttemptForm';
import EmptyState from '../ui/EmptyState';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysSince(d: string) {
  return Math.round((Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000);
}

const METHOD_COLORS: Record<string, string> = {
  'Phone Call': 'bg-blue-50 text-blue-700 border-blue-200',
  'Email': 'bg-purple-50 text-purple-700 border-purple-200',
  'LinkedIn': 'bg-sky-50 text-sky-700 border-sky-200',
  'In Person': 'bg-green-50 text-green-700 border-green-200',
  'Other': 'bg-zinc-50 text-zinc-700 border-zinc-200',
};

const OUTCOME_COLORS: Record<string, string> = {
  'No Answer': 'bg-amber-50 text-amber-700 border-amber-200',
  'Voicemail': 'bg-amber-50 text-amber-700 border-amber-200',
  'Bounced': 'bg-red-50 text-red-700 border-red-200',
  'Replied': 'bg-green-50 text-green-700 border-green-200',
  'Connected': 'bg-green-50 text-green-700 border-green-200',
  'Other': 'bg-zinc-50 text-zinc-700 border-zinc-200',
};

export default function AccountOutreachSection({
  accountId,
  accountName,
}: {
  accountId: string;
  accountName: string;
}) {
  const [attempts, setAttempts] = useState<ContactAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);

  const load = () => {
    setLoading(true);
    getContactAttemptsForAccount(accountId).then(setAttempts).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [accountId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact attempt?')) return;
    await deleteContactAttempt(id);
    load();
  };

  const latest = attempts[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-zinc-500">
          {attempts.length === 0
            ? 'No contact attempts logged yet'
            : `${attempts.length} attempt${attempts.length === 1 ? '' : 's'}${latest ? ` · last ${daysSince(latest.attempt_date)}d ago` : ''}`}
        </div>
        {!showLogForm && (
          <button
            onClick={() => setShowLogForm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white border-none rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#16a34a' }}
          >
            <Plus size={12} /> Log Attempt
          </button>
        )}
      </div>

      {showLogForm && (
        <LogContactAttemptForm
          accountId={accountId}
          accountName={accountName}
          onSaved={() => { setShowLogForm(false); load(); }}
          onCancel={() => setShowLogForm(false)}
        />
      )}

      {loading ? (
        <div className="text-zinc-400 py-6 text-center text-sm">Loading...</div>
      ) : attempts.length === 0 ? (
        <EmptyState message="No contact attempts logged for this account." />
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm">
          {attempts.map((a, idx) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/50 transition-colors ${idx < attempts.length - 1 ? 'border-b border-zinc-100' : ''}`}
            >
              <Phone size={14} className="text-zinc-400 shrink-0" />
              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-800">{formatDate(a.attempt_date)}</span>
                <span className="text-[10px] text-zinc-400">({daysSince(a.attempt_date)}d ago)</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${METHOD_COLORS[a.method] || METHOD_COLORS.Other}`}>
                  {a.method}
                </span>
                {a.outcome && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${OUTCOME_COLORS[a.outcome] || OUTCOME_COLORS.Other}`}>
                    {a.outcome}
                  </span>
                )}
                {a.notes && <span className="text-xs text-zinc-500 italic truncate">{a.notes}</span>}
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                title="Delete"
                className="text-zinc-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-1"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
