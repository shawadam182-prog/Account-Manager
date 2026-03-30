import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { Account, RAGStatus } from '../../lib/types';
import RAGBadge from '../ui/RAGBadge';
import StatusBadge from '../ui/StatusBadge';
import MembershipBadge from '../ui/MembershipBadge';
import LastContactBadge from '../ui/LastContactBadge';
import HealthBadge from '../ui/HealthBadge';
import { computeHealthScore, healthConfig } from '../../utils/healthScore';
import { updateAccount } from '../../services/accountsService';

type SortKey = 'company_name' | 'health' | 'report_status' | 'rag_status' | 'last_meeting_date' | 'renewal_month';
type SortDir = 'asc' | 'desc';

const HEALTH_ORDER = { critical: 0, risk: 1, monitor: 2, healthy: 3 };

function sortAccounts(accounts: Account[], key: SortKey, dir: SortDir): Account[] {
  return [...accounts].sort((a, b) => {
    let av: string | number | null = null;
    let bv: string | number | null = null;
    if (key === 'health') {
      av = HEALTH_ORDER[computeHealthScore(a)];
      bv = HEALTH_ORDER[computeHealthScore(b)];
    } else if (key === 'last_meeting_date') {
      av = a.last_meeting_date ? new Date(a.last_meeting_date).getTime() : 0;
      bv = b.last_meeting_date ? new Date(b.last_meeting_date).getTime() : 0;
    } else {
      av = (a[key] as string) ?? '';
      bv = (b[key] as string) ?? '';
    }
    if (av === bv) return 0;
    const cmp = (av ?? '') < (bv ?? '') ? -1 : 1;
    return dir === 'asc' ? cmp : -cmp;
  });
}

function RAGPopover({ account, onUpdated }: { account: Account; onUpdated: (val: RAGStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const options: { value: RAGStatus; color: string }[] = [
    { value: 'Green', color: '#16A34A' },
    { value: 'Amber', color: '#D97706' },
    { value: 'Red',   color: '#E11D48' },
  ];

  const handleSelect = async (val: RAGStatus) => {
    setOpen(false);
    onUpdated(val);
    await updateAccount(account.id, { rag_status: val });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity"
        title="Click to change RAG"
      >
        <RAGBadge status={account.rag_status} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-xl shadow-lg z-50 min-w-[140px] p-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="flex items-center gap-3 w-full px-3 py-2 text-[13px] font-bold text-zinc-700 bg-transparent border-none cursor-pointer rounded-lg text-left hover:bg-zinc-50 transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: opt.color }} />
              {opt.value}
            </button>
          ))}
          <button
            onClick={() => handleSelect(null as unknown as RAGStatus)}
            className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold text-zinc-400 bg-transparent border-none border-t border-zinc-100 cursor-pointer rounded-lg text-left hover:bg-zinc-50 transition-colors mt-0.5"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

export default function AccountTable({ accounts }: { accounts: Account[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('health');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);

  useEffect(() => { setLocalAccounts(accounts); }, [accounts]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleRAGUpdate = (id: string, val: RAGStatus) => {
    setLocalAccounts(prev => prev.map(a => a.id === id ? { ...a, rag_status: val } : a));
  };

  const sorted = sortAccounts(localAccounts, sortKey, sortDir);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={13} className="text-zinc-300" />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-brand-primary" />
      : <ChevronDown size={13} className="text-brand-primary" />;
  };

  const thClassName = "px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500 cursor-pointer select-none whitespace-nowrap bg-white/50 backdrop-blur-sm border-b border-zinc-200/80 hover:bg-white/80 transition-colors text-left";

  if (sorted.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200/80 p-12 text-center text-sm font-semibold text-zinc-500 shadow-sm">
        No accounts match your filters.
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-[3px] p-0 cursor-default bg-white/50 border-b border-zinc-200/80" />
            <th className={thClassName} onClick={() => handleSort('company_name')}>
              <span className="inline-flex items-center gap-1.5">Company <SortIcon col="company_name" /></span>
            </th>
            <th className={thClassName} onClick={() => handleSort('health')}>
              <span className="inline-flex items-center gap-1.5">Health <SortIcon col="health" /></span>
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500 cursor-default select-none whitespace-nowrap bg-white/50 backdrop-blur-sm border-b border-zinc-200/80 text-left">Membership</th>
            <th className={thClassName} onClick={() => handleSort('report_status')}>
              <span className="inline-flex items-center gap-1.5">Report <SortIcon col="report_status" /></span>
            </th>
            <th className={thClassName} onClick={() => handleSort('rag_status')}>
              <span className="inline-flex items-center gap-1.5">RAG <SortIcon col="rag_status" /></span>
            </th>
            <th className={thClassName} onClick={() => handleSort('last_meeting_date')}>
              <span className="inline-flex items-center gap-1.5">Last Contact <SortIcon col="last_meeting_date" /></span>
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500 cursor-default select-none whitespace-nowrap bg-white/50 backdrop-blur-sm border-b border-zinc-200/80 text-left">Actions</th>
            <th className={thClassName} onClick={() => handleSort('renewal_month')}>
              <span className="inline-flex items-center gap-1.5">Renewal <SortIcon col="renewal_month" /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => {
            const health = computeHealthScore(a);
            const isShell = !a.membership_level && !a.rag_status && !a.report_status;
            const hasOverdue = (a.overdue_actions_count ?? 0) > 0;

            return (
              <tr
                key={a.id}
                className={`border-b border-zinc-200/50 transition-colors duration-200 bg-transparent hover:bg-zinc-50/60 ${isShell ? 'opacity-60' : 'opacity-100'} group`}
              >
                <td className="w-[3px] p-0 transition-colors" style={{ background: isShell ? '#D1C9BC' : healthConfig[health].border }} />

                <td className="px-4 py-3.5 align-middle">
                  <div>
                    <Link
                      to={`/accounts/${a.id}`}
                      className="text-zinc-900 no-underline font-semibold text-sm inline-flex items-center gap-2 hover:text-brand-primary transition-colors"
                    >
                      {a.company_name}
                      {isShell && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 uppercase tracking-widest">
                          incomplete
                        </span>
                      )}
                    </Link>
                    {a.main_poc && (
                       <p className="text-xs font-medium text-zinc-400 mt-0.5">{a.main_poc}</p>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3.5 align-middle"><HealthBadge account={a} /></td>

                <td className="px-4 py-3.5 align-middle">
                  <div className="flex flex-col gap-1.5 items-start">
                    <MembershipBadge level={a.membership_level} />
                    {a.add_ons?.filter(Boolean).length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {a.add_ons.filter(Boolean).map((addon) => (
                          <span key={addon} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-bold uppercase tracking-widest">
                            {addon}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3.5 align-middle"><StatusBadge status={a.report_status} /></td>

                <td className="px-4 py-3.5 align-middle"><RAGPopover account={a} onUpdated={(val) => handleRAGUpdate(a.id, val)} /></td>

                <td className="px-4 py-3.5 align-middle"><LastContactBadge days={a.days_since_contact} /></td>

                <td className="px-4 py-3.5 align-middle">
                  {(a.open_actions_count ?? 0) > 0 ? (
                    <span className={`inline-flex items-center justify-center min-w-[24px] h-6 rounded-full text-xs font-bold ${hasOverdue ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>
                      {a.open_actions_count}
                    </span>
                  ) : (
                    <span className="text-zinc-300 text-sm font-bold">—</span>
                  )}
                </td>

                <td className="px-4 py-3.5 align-middle">
                  {a.renewal_month ? (
                    <div>
                      <span className="text-sm text-zinc-700 font-bold">
                        {a.renewal_month}
                      </span>
                      {a.reporting_deadline && (
                        <p className={`text-[11px] mt-0.5 font-mono font-semibold ${new Date(a.reporting_deadline) < new Date() ? 'text-red-500' : 'text-zinc-400'}`}>
                          {new Date(a.reporting_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-300 text-sm font-bold">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

