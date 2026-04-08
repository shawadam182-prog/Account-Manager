import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ChevronDown, ChevronRight } from 'lucide-react';
import type { Account, ContactAttempt } from '../../lib/types';
import { getAllContactAttempts, deleteContactAttempt } from '../../services/contactAttemptsService';
import LogContactAttemptForm from './LogContactAttemptForm';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysSince(d: string | null) {
  if (!d) return null;
  const diff = Math.round((Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000);
  return diff;
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

export default function OutreachView({ accounts }: { accounts: Account[] }) {
  const [attempts, setAttempts] = useState<ContactAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [logForAccountId, setLogForAccountId] = useState<string | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [showOnlyAttempted, setShowOnlyAttempted] = useState(false);

  const load = () => {
    setLoading(true);
    getAllContactAttempts().then(setAttempts).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Group attempts by account, find latest
  const byAccount = useMemo(() => {
    const map = new Map<string, ContactAttempt[]>();
    for (const a of attempts) {
      const arr = map.get(a.account_id) || [];
      arr.push(a);
      map.set(a.account_id, arr);
    }
    return map;
  }, [attempts]);

  const rows = useMemo(() => {
    const enriched = accounts.map(acc => {
      const list = byAccount.get(acc.id) || [];
      const latest = list[0] || null;
      return { account: acc, latest, count: list.length, history: list };
    });
    const filtered = showOnlyAttempted ? enriched.filter(r => r.count > 0) : enriched;
    return filtered.sort((a, b) => {
      // Accounts with attempts first, sorted by most recent attempt date desc
      // Then accounts with no attempts at the bottom
      if (!a.latest && !b.latest) return a.account.company_name.localeCompare(b.account.company_name);
      if (!a.latest) return 1;
      if (!b.latest) return -1;
      return b.latest.attempt_date.localeCompare(a.latest.attempt_date);
    });
  }, [accounts, byAccount, showOnlyAttempted]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact attempt?')) return;
    await deleteContactAttempt(id);
    load();
  };

  if (loading) {
    return <div className="text-zinc-400 py-12 text-center text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyAttempted}
              onChange={e => setShowOnlyAttempted(e.target.checked)}
              className="cursor-pointer"
            />
            Only show accounts with attempts
          </label>
          <span className="text-xs text-zinc-400">
            {rows.length} account{rows.length === 1 ? '' : 's'} · {attempts.length} total attempts
          </span>
        </div>
      </div>

      {/* Log form */}
      {logForAccountId && (
        <LogContactAttemptForm
          accountId={logForAccountId}
          accountName={accounts.find(a => a.id === logForAccountId)?.company_name}
          onSaved={() => { setLogForAccountId(null); load(); }}
          onCancel={() => setLogForAccountId(null)}
        />
      )}

      {/* Table */}
      <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto_auto] gap-3 px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          <div></div>
          <div>Account</div>
          <div>Last Attempt</div>
          <div>Method</div>
          <div>Outcome</div>
          <div>Count</div>
          <div></div>
        </div>
        {rows.map(({ account, latest, count, history }) => {
          const isExpanded = expandedAccountId === account.id;
          const days = daysSince(latest?.attempt_date || null);
          return (
            <div key={account.id} className="border-b border-zinc-100 last:border-b-0">
              <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto_auto] gap-3 px-4 py-3 items-center hover:bg-zinc-50/50 transition-colors">
                <button
                  type="button"
                  onClick={() => setExpandedAccountId(isExpanded ? null : account.id)}
                  disabled={count === 0}
                  className="text-zinc-400 hover:text-zinc-700 bg-transparent border-none cursor-pointer p-0 disabled:opacity-20 disabled:cursor-default"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <Link to={`/accounts/${account.id}`} className="text-sm font-semibold text-zinc-800 hover:text-brand-primary no-underline truncate">
                  {account.company_name}
                </Link>
                <div className="text-sm text-zinc-600">
                  {latest ? (
                    <span>
                      {formatDate(latest.attempt_date)}
                      {days !== null && (
                        <span className="text-[10px] text-zinc-400 ml-1.5">({days}d ago)</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-300 italic">Never contacted</span>
                  )}
                </div>
                <div>
                  {latest && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${METHOD_COLORS[latest.method] || METHOD_COLORS.Other}`}>
                      {latest.method}
                    </span>
                  )}
                </div>
                <div>
                  {latest?.outcome && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${OUTCOME_COLORS[latest.outcome] || OUTCOME_COLORS.Other}`}>
                      {latest.outcome}
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-zinc-500 text-center w-8">{count}</div>
                <button
                  type="button"
                  onClick={() => setLogForAccountId(account.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white border-none rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#16a34a' }}
                >
                  <Phone size={11} /> Log
                </button>
              </div>

              {/* History */}
              {isExpanded && count > 0 && (
                <div className="bg-zinc-50/50 px-4 py-2 border-t border-zinc-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">History</div>
                  <div className="flex flex-col gap-1.5">
                    {history.map(h => (
                      <div key={h.id} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-zinc-500 w-24 shrink-0">{formatDate(h.attempt_date)}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${METHOD_COLORS[h.method] || METHOD_COLORS.Other}`}>
                          {h.method}
                        </span>
                        {h.outcome && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${OUTCOME_COLORS[h.outcome] || OUTCOME_COLORS.Other}`}>
                            {h.outcome}
                          </span>
                        )}
                        {h.notes && <span className="text-zinc-500 italic truncate">{h.notes}</span>}
                        <button
                          type="button"
                          onClick={() => handleDelete(h.id)}
                          className="ml-auto text-[10px] text-zinc-400 hover:text-red-500 bg-transparent border-none cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="text-center py-8 text-sm text-zinc-400">No accounts to show</div>
        )}
      </div>
    </div>
  );
}
