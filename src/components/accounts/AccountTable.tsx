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
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        title="Click to change RAG"
      >
        <RAGBadge status={account.rag_status} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', left: 0, top: '100%', marginTop: '4px',
          background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '120px',
          padding: '4px',
        }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '6px 10px', fontSize: '13px',
                background: 'none', border: 'none', cursor: 'pointer',
                borderRadius: '4px', textAlign: 'left', color: '#374151',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: opt.color }} />
              {opt.value}
            </button>
          ))}
          <button
            onClick={() => handleSelect(null as unknown as RAGStatus)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '6px 10px', fontSize: '12px',
              background: 'none', border: 'none', cursor: 'pointer',
              borderRadius: '4px', textAlign: 'left', color: '#9CA3AF',
              borderTop: '1px solid #F3F4F6', marginTop: '2px',
            }}
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
    if (sortKey !== col) return <ChevronsUpDown size={11} color="#C4BDB4" />;
    return sortDir === 'asc'
      ? <ChevronUp size={11} color="#16a34a" />
      : <ChevronDown size={11} color="#16a34a" />;
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#6B7280',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    background: '#FDFCF9',
  };

  if (sorted.length === 0) {
    return (
      <div style={{
        background: 'white', borderRadius: '10px',
        border: '1px solid #E8E3DB',
        padding: '48px', textAlign: 'center',
        color: '#9CA3AF', fontSize: '14px',
      }}>
        No accounts match your filters.
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '10px',
      border: '1px solid #E8E3DB',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #EDE8E0' }}>
            <th style={{ ...thStyle, width: '3px', padding: 0, cursor: 'default' }} />
            <th style={thStyle} onClick={() => handleSort('company_name')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Company <SortIcon col="company_name" />
              </span>
            </th>
            <th style={thStyle} onClick={() => handleSort('health')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Health <SortIcon col="health" />
              </span>
            </th>
            <th style={{ ...thStyle, cursor: 'default' }}>Membership</th>
            <th style={thStyle} onClick={() => handleSort('report_status')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Report <SortIcon col="report_status" />
              </span>
            </th>
            <th style={thStyle} onClick={() => handleSort('rag_status')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                RAG <SortIcon col="rag_status" />
              </span>
            </th>
            <th style={thStyle} onClick={() => handleSort('last_meeting_date')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Last Contact <SortIcon col="last_meeting_date" />
              </span>
            </th>
            <th style={{ ...thStyle, cursor: 'default' }}>Actions</th>
            <th style={thStyle} onClick={() => handleSort('renewal_month')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Renewal <SortIcon col="renewal_month" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => {
            const health = computeHealthScore(a);
            const isShell = !a.membership_level && !a.rag_status && !a.report_status;
            const hasOverdue = (a.overdue_actions_count ?? 0) > 0;
            const isHovered = hoveredId === a.id;

            return (
              <tr
                key={a.id}
                onMouseEnter={() => setHoveredId(a.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  borderBottom: '1px solid #F0EBE3',
                  background: isHovered ? '#FDFCF9' : 'white',
                  opacity: isShell ? 0.55 : 1,
                  transition: 'background 0.1s ease',
                }}
              >
                <td style={{
                  width: '3px',
                  padding: 0,
                  background: isShell ? '#D1C9BC' : healthConfig[health].border,
                }} />

                <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                  <div>
                    <Link
                      to={`/accounts/${a.id}`}
                      style={{
                        color: '#111827',
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#16a34a')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#111827')}
                    >
                      {a.company_name}
                      {isShell && (
                        <span style={{
                          fontSize: '10px', fontWeight: 500, padding: '1px 5px',
                          borderRadius: '3px', background: '#F3F4F6', color: '#9CA3AF',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          incomplete
                        </span>
                      )}
                    </Link>
                    {a.main_poc && (
                      <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>
                        {a.main_poc}
                      </p>
                    )}
                  </div>
                </td>

                <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                  <HealthBadge account={a} />
                </td>

                <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <MembershipBadge level={a.membership_level} />
                    {a.add_ons?.filter(Boolean).length > 0 && (
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {a.add_ons.filter(Boolean).map((addon) => (
                          <span key={addon} style={{
                            fontSize: '10px', padding: '1px 5px', borderRadius: '3px',
                            background: '#F0EDE8', color: '#6B7280', fontWeight: 500,
                          }}>
                            {addon}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                  <StatusBadge status={a.report_status} />
                </td>

                <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                  <RAGPopover account={a} onUpdated={(val) => handleRAGUpdate(a.id, val)} />
                </td>

                <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                  <LastContactBadge days={a.days_since_contact} />
                </td>

                <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                  {(a.open_actions_count ?? 0) > 0 ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: '22px', height: '22px', borderRadius: '50%',
                      fontSize: '11px', fontWeight: 600,
                      background: hasOverdue ? '#FEE2E2' : '#F3F4F6',
                      color: hasOverdue ? '#991B1B' : '#6B7280',
                    }}>
                      {a.open_actions_count}
                    </span>
                  ) : (
                    <span style={{ color: '#D1C9BC', fontSize: '13px' }}>—</span>
                  )}
                </td>

                <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                  {a.renewal_month ? (
                    <div>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                        {a.renewal_month}
                      </span>
                      {a.reporting_deadline && (
                        <p style={{
                          fontSize: '11px',
                          color: new Date(a.reporting_deadline) < new Date() ? '#DC2626' : '#9CA3AF',
                          marginTop: '1px',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {new Date(a.reporting_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#D1C9BC', fontSize: '13px' }}>—</span>
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
