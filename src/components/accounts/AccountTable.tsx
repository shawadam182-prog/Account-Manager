import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight } from 'lucide-react';
import type { Account, RAGStatus, ReportStatus, MembershipLevel } from '../../lib/types';
import RAGBadge from '../ui/RAGBadge';
import StatusBadge from '../ui/StatusBadge';
import MembershipBadge from '../ui/MembershipBadge';
import LastContactBadge from '../ui/LastContactBadge';
import { updateAccount } from '../../services/accountsService';

type SortKey = 'company_name' | 'report_status' | 'rag_status' | 'last_meeting_date' | 'renewal_month';
type SortDir = 'asc' | 'desc';

function sortAccounts(accounts: Account[], key: SortKey, dir: SortDir): Account[] {
  return [...accounts].sort((a, b) => {
    let av: string | number | null = null;
    let bv: string | number | null = null;
    if (key === 'last_meeting_date') {
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

/* ------------------------------------------------------------------ */
/*  Generic popover wrapper                                            */
/* ------------------------------------------------------------------ */

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onClose]);
}

function TablePopover({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity"
      >
        {trigger}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-xl shadow-lg z-50 min-w-[160px] p-1">
          {children(close)}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RAG Popover                                                        */
/* ------------------------------------------------------------------ */

function RAGPopover({ account, onUpdated }: { account: Account; onUpdated: (val: RAGStatus | null) => void }) {
  const options: { value: RAGStatus; color: string }[] = [
    { value: 'Green', color: '#16A34A' },
    { value: 'Amber', color: '#D97706' },
    { value: 'Red',   color: '#E11D48' },
  ];

  return (
    <TablePopover trigger={<RAGBadge status={account.rag_status} />}>
      {(close) => (
        <>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { close(); onUpdated(opt.value); updateAccount(account.id, { rag_status: opt.value }); }}
              className="flex items-center gap-3 w-full px-3 py-2 text-[13px] font-bold text-zinc-700 bg-transparent border-none cursor-pointer rounded-lg text-left hover:bg-zinc-50 transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: opt.color }} />
              {opt.value}
            </button>
          ))}
          <button
            onClick={() => { close(); onUpdated(null); updateAccount(account.id, { rag_status: null } as Partial<Account>); }}
            className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold text-zinc-400 bg-transparent border-none cursor-pointer rounded-lg text-left hover:bg-zinc-50 transition-colors mt-0.5"
          >
            Clear
          </button>
        </>
      )}
    </TablePopover>
  );
}

/* ------------------------------------------------------------------ */
/*  Report Status Popover                                              */
/* ------------------------------------------------------------------ */

function ReportPopover({ account, onUpdated }: { account: Account; onUpdated: (val: ReportStatus | null) => void }) {
  const options: ReportStatus[] = ['In progress', 'Overdue', 'Report Delivered', 'Data Submitted'];

  return (
    <TablePopover trigger={<StatusBadge status={account.report_status} />}>
      {(close) => (
        <>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { close(); onUpdated(opt); updateAccount(account.id, { report_status: opt }); }}
              className="flex items-center gap-3 w-full px-3 py-2 text-[13px] font-bold text-zinc-700 bg-transparent border-none cursor-pointer rounded-lg text-left hover:bg-zinc-50 transition-colors"
            >
              <StatusBadge status={opt} />
            </button>
          ))}
          <button
            onClick={() => { close(); onUpdated(null); updateAccount(account.id, { report_status: null } as Partial<Account>); }}
            className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold text-zinc-400 bg-transparent border-none cursor-pointer rounded-lg text-left hover:bg-zinc-50 transition-colors mt-0.5"
          >
            Clear
          </button>
        </>
      )}
    </TablePopover>
  );
}

/* ------------------------------------------------------------------ */
/*  Membership Popover                                                 */
/* ------------------------------------------------------------------ */

function MembershipPopover({ account, onUpdated }: { account: Account; onUpdated: (val: MembershipLevel | null) => void }) {
  const options: MembershipLevel[] = ['Business Certification', 'Advanced', 'Net Zero Committed', 'Multiple Tiers', 'Achiever'];

  return (
    <TablePopover trigger={<MembershipBadge level={account.membership_level} />}>
      {(close) => (
        <>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { close(); onUpdated(opt); updateAccount(account.id, { membership_level: opt }); }}
              className="flex items-center gap-3 w-full px-3 py-2 text-[13px] font-bold text-zinc-700 bg-transparent border-none cursor-pointer rounded-lg text-left hover:bg-zinc-50 transition-colors"
            >
              <MembershipBadge level={opt} />
            </button>
          ))}
          <button
            onClick={() => { close(); onUpdated(null); updateAccount(account.id, { membership_level: null } as Partial<Account>); }}
            className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold text-zinc-400 bg-transparent border-none cursor-pointer rounded-lg text-left hover:bg-zinc-50 transition-colors mt-0.5"
          >
            Clear
          </button>
        </>
      )}
    </TablePopover>
  );
}

/* ------------------------------------------------------------------ */
/*  Add-Ons Popover (multi-select)                                     */
/* ------------------------------------------------------------------ */

const ALL_ADDONS = ['Social Value', 'PPN', 'ESOS', 'Data Management'];

function AddOnsPopover({ account, onUpdated }: { account: Account; onUpdated: (val: string[]) => void }) {
  const current = account.add_ons?.filter(Boolean) ?? [];

  const toggle = (addon: string) => {
    const next = current.includes(addon)
      ? current.filter(a => a !== addon)
      : [...current, addon];
    onUpdated(next);
    updateAccount(account.id, { add_ons: next });
  };

  const triggerEl = current.length > 0 ? (
    <div className="flex gap-1 flex-wrap">
      {current.map((addon) => (
        <span key={addon} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-bold uppercase tracking-widest">
          {addon}
        </span>
      ))}
    </div>
  ) : (
    <span className="text-zinc-300 text-sm font-bold">—</span>
  );

  return (
    <TablePopover trigger={triggerEl}>
      {() => (
        <>
          {ALL_ADDONS.map((addon) => (
            <label
              key={addon}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-zinc-700 cursor-pointer rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={current.includes(addon)}
                onChange={() => toggle(addon)}
                className="w-3.5 h-3.5 text-brand-primary rounded border-zinc-300 cursor-pointer"
              />
              {addon}
            </label>
          ))}
        </>
      )}
    </TablePopover>
  );
}

/* ------------------------------------------------------------------ */
/*  Account Table                                                      */
/* ------------------------------------------------------------------ */

export default function AccountTable({ accounts }: { accounts: Account[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('company_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => { setLocalAccounts(accounts); }, [accounts]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const updateLocal = (id: string, patch: Partial<Account>) => {
    setLocalAccounts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const toggleGroup = (parentId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  // --- Grouping logic ---
  const childMap = new Map<string, Account[]>(); // parentId -> children
  const childIds = new Set<string>();

  for (const a of localAccounts) {
    if (a.parent_account_id) {
      childIds.add(a.id);
      const siblings = childMap.get(a.parent_account_id) || [];
      siblings.push(a);
      childMap.set(a.parent_account_id, siblings);
    }
  }

  const parentIds = new Set(childMap.keys());

  // Top-level accounts: non-children (parents + ungrouped)
  const topLevel = localAccounts.filter(a => !childIds.has(a.id));
  const sorted = sortAccounts(topLevel, sortKey, sortDir);

  const showAlphaHeaders = sortKey === 'company_name' && sortDir === 'asc';

  const letterOf = (name: string) => {
    const ch = (name || '').trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(ch) ? ch : '#';
  };

  // Build flattened display list
  type Row =
    | { kind: 'section'; letter: string }
    | { kind: 'account'; account: Account; isChild: boolean; isParent: boolean; childCount: number };
  const displayRows: Row[] = [];
  let currentLetter = '';
  for (const a of sorted) {
    if (showAlphaHeaders) {
      const letter = letterOf(a.company_name);
      if (letter !== currentLetter) {
        displayRows.push({ kind: 'section', letter });
        currentLetter = letter;
      }
    }
    const isParent = parentIds.has(a.id);
    const children = childMap.get(a.id) || [];
    displayRows.push({ kind: 'account', account: a, isChild: false, isParent, childCount: children.length });

    if (isParent && expandedGroups.has(a.id)) {
      const sortedChildren = sortAccounts(children, 'company_name', 'asc');
      for (const child of sortedChildren) {
        displayRows.push({ kind: 'account', account: child, isChild: true, isParent: false, childCount: 0 });
      }
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={13} className="text-zinc-300" />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-brand-primary" />
      : <ChevronDown size={13} className="text-brand-primary" />;
  };

  const thClassName = "px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500 cursor-pointer select-none whitespace-nowrap bg-white/50 backdrop-blur-sm border-b border-zinc-200/80 hover:bg-white/80 transition-colors text-left";

  if (displayRows.length === 0) {
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
            <th className={thClassName} onClick={() => handleSort('company_name')}>
              <span className="inline-flex items-center gap-1.5">Company <SortIcon col="company_name" /></span>
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
          {displayRows.map((row, idx) => {
            if (row.kind === 'section') {
              return (
                <tr key={`section-${row.letter}-${idx}`} className="bg-zinc-50/60">
                  <td colSpan={7} className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-200/60">
                    {row.letter}
                  </td>
                </tr>
              );
            }
            const { account: a, isChild, isParent, childCount } = row;
            const isShell = !a.membership_level && !a.rag_status && !a.report_status;
            const hasOverdue = (a.overdue_actions_count ?? 0) > 0;
            const isExpanded = expandedGroups.has(a.id);

            return (
              <tr
                key={a.id}
                className={`border-b border-zinc-200/50 transition-colors duration-200 bg-transparent hover:bg-zinc-50/60 ${isShell ? 'opacity-60' : 'opacity-100'} ${isChild ? 'bg-zinc-50/30' : ''} group`}
              >
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex items-center gap-1.5" style={isChild ? { paddingLeft: '24px' } : undefined}>
                    {isParent && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleGroup(a.id); }}
                        className="bg-transparent border-none p-0.5 cursor-pointer text-zinc-400 hover:text-zinc-700 transition-colors shrink-0"
                      >
                        <ChevronRight
                          size={14}
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s ease',
                          }}
                        />
                      </button>
                    )}
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
                        {isParent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                            {childCount} {childCount === 1 ? 'member' : 'members'}
                          </span>
                        )}
                      </Link>
                      {a.main_poc && (
                        <p className="text-xs font-medium text-zinc-400 mt-0.5">{a.main_poc}</p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5 align-middle">
                  <div className="flex flex-col gap-1.5 items-start">
                    <MembershipPopover
                      account={a}
                      onUpdated={(val) => updateLocal(a.id, { membership_level: val })}
                    />
                    <AddOnsPopover
                      account={a}
                      onUpdated={(val) => updateLocal(a.id, { add_ons: val })}
                    />
                  </div>
                </td>

                <td className="px-4 py-3.5 align-middle">
                  <ReportPopover
                    account={a}
                    onUpdated={(val) => updateLocal(a.id, { report_status: val })}
                  />
                </td>

                <td className="px-4 py-3.5 align-middle">
                  <RAGPopover
                    account={a}
                    onUpdated={(val) => updateLocal(a.id, { rag_status: val })}
                  />
                </td>

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
