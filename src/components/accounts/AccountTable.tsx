import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { Account, RAGStatus } from '../../lib/types';
import RAGBadge from '../ui/RAGBadge';
import StatusBadge from '../ui/StatusBadge';
import MembershipBadge from '../ui/MembershipBadge';
import LastContactBadge from '../ui/LastContactBadge';
import HealthBadge from '../ui/HealthBadge';
import { computeHealthScore } from '../../utils/healthScore';
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
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options: { value: RAGStatus; dot: string }[] = [
    { value: 'Green', dot: 'bg-emerald-500' },
    { value: 'Amber', dot: 'bg-amber-400' },
    { value: 'Red',   dot: 'bg-red-500'    },
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
        className="hover:opacity-80 transition-opacity"
        title="Click to change RAG status"
      >
        <RAGBadge status={account.rag_status} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-1 min-w-[110px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs hover:bg-gray-50 rounded"
            >
              <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
              {opt.value}
            </button>
          ))}
          <button
            onClick={() => handleSelect(null as unknown as RAGStatus)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs hover:bg-gray-50 rounded text-gray-400"
          >
            <span className="w-2 h-2 rounded-full bg-gray-300" />
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
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleRAGUpdate = (accountId: string, newStatus: RAGStatus) => {
    setLocalAccounts((prev) =>
      prev.map((a) => a.id === accountId ? { ...a, rag_status: newStatus } : a)
    );
  };

  const sorted = sortAccounts(localAccounts, sortKey, sortDir);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={12} className="text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-emerald-500" />
      : <ChevronDown size={12} className="text-emerald-500" />;
  };

  const Th = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon col={col} />
      </span>
    </th>
  );

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">No accounts match your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <Th col="company_name" label="Company" />
            <Th col="health" label="Health" />
            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Membership</th>
            <Th col="report_status" label="Report" />
            <Th col="rag_status" label="RAG" />
            <Th col="last_meeting_date" label="Last Contact" />
            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
            <Th col="renewal_month" label="Renewal" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((a) => {
            const isShell = !a.membership_level && !a.rag_status && !a.report_status;
            const hasOverdueActions = (a.overdue_actions_count ?? 0) > 0;
            const deadlinePast = a.reporting_deadline && new Date(a.reporting_deadline) < new Date();

            return (
              <tr
                key={a.id}
                className={`hover:bg-gray-50 transition-colors ${isShell ? 'opacity-60' : ''}`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Link to={`/accounts/${a.id}`} className="text-emerald-600 hover:text-emerald-700 font-medium">
                      {a.company_name}
                    </Link>
                    {isShell && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">Incomplete</span>
                    )}
                  </div>
                  {a.main_poc && (
                    <p className="text-xs text-gray-400 mt-0.5">{a.main_poc}</p>
                  )}
                </td>
                <td className="py-3 px-4"><HealthBadge account={a} /></td>
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <MembershipBadge level={a.membership_level} />
                    {a.add_ons?.filter(Boolean).length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {a.add_ons.filter(Boolean).map((addon) => (
                          <span key={addon} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                            {addon}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4"><StatusBadge status={a.report_status} /></td>
                <td className="py-3 px-4">
                  <RAGPopover account={a} onUpdated={(val) => handleRAGUpdate(a.id, val)} />
                </td>
                <td className="py-3 px-4">
                  <LastContactBadge days={a.days_since_contact} />
                </td>
                <td className="py-3 px-4">
                  {(a.open_actions_count ?? 0) > 0 ? (
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${hasOverdueActions ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {a.open_actions_count}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-0.5">
                    <span className="text-sm text-gray-600">{a.renewal_month || '—'}</span>
                    {a.reporting_deadline && (
                      <p className={`text-xs ${deadlinePast ? 'text-red-500' : 'text-gray-400'}`}>
                        due {new Date(a.reporting_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
