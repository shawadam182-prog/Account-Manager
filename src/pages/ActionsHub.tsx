import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import type { Action } from '../lib/types';
import { getAllActions, getAllOpenActions, updateActionStatus } from '../services/actionsService';
import { exportActionsCsv } from '../utils/csvExport';

function getDueDateInfo(dueDate: string | null): { label: string; color: string; urgent: boolean } | null {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: '#DC2626', urgent: true };
  if (diffDays === 0) return { label: 'Due today', color: '#D97706', urgent: true };
  if (diffDays <= 3) return { label: `Due in ${diffDays}d`, color: '#D97706', urgent: false };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, color: '#3B82F6', urgent: false };
  return null;
}

export default function ActionsHub() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [showCompleted, setShowCompleted] = useState(false);
  const [exportHover, setExportHover] = useState(false);

  useEffect(() => {
    document.title = 'Actions — Planet Mark AM';
  }, []);

  const loadActions = async () => {
    const data = showCompleted ? await getAllActions() : await getAllOpenActions();
    setActions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadActions();
  }, [showCompleted]);

  const toggle = async (action: Action) => {
    const newStatus = action.status === 'Done' ? 'Open' : 'Done';
    // Optimistic update
    setActions((prev) =>
      prev.map((a) =>
        a.id === action.id
          ? { ...a, status: newStatus, completed_at: newStatus === 'Done' ? new Date().toISOString() : null }
          : a
      )
    );
    try {
      await updateActionStatus(action.id, newStatus);
    } catch {
      setActions((prev) =>
        prev.map((a) => (a.id === action.id ? action : a))
      );
    }
  };

  const filtered = actions.filter((a) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const accountName = a.account?.company_name?.toLowerCase() || '';
      if (!a.description.toLowerCase().includes(term) && !accountName.includes(term)) return false;
    }
    if (ownerFilter !== 'All') {
      if (ownerFilter === 'Other') {
        if (a.owner === 'Millie' || a.owner === 'Client') return false;
      } else {
        if (a.owner !== ownerFilter) return false;
      }
    }
    return true;
  });

  const millie = filtered.filter((a) => a.owner === 'Millie' && a.status === 'Open');
  const client = filtered.filter((a) => a.owner === 'Client' && a.status === 'Open');
  const other = filtered.filter((a) => a.owner !== 'Millie' && a.owner !== 'Client' && a.status === 'Open');
  const completed = filtered.filter((a) => a.status === 'Done');

  const openCount = actions.filter((a) => a.status === 'Open').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#9CA3AF' }}>
        Loading...
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid #E5E0D8',
    borderRadius: '6px',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    color: '#111827',
    background: '#FDFCF9',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Actions
          <span style={{ fontSize: '14px', fontWeight: 400, color: '#9CA3AF', marginLeft: '8px' }}>
            {openCount} open
          </span>
        </h1>
        <button
          onClick={() => exportActionsCsv(filtered)}
          onMouseEnter={() => setExportHover(true)}
          onMouseLeave={() => setExportHover(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', fontSize: '12px', fontWeight: 500,
            color: '#6B7280', background: exportHover ? '#F5F0E8' : 'transparent',
            border: '1px solid #E5E0D8', borderRadius: '6px', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        marginBottom: '24px',
        background: 'white', border: '1px solid #E8E3DB', borderRadius: '10px',
        padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <input
          type="text"
          placeholder="Search by account or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, width: '260px' }}
        />
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="All">All owners</option>
          <option value="Millie">Millie</option>
          <option value="Client">Client</option>
          <option value="Other">Other</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          Show completed
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ActionSection title="My Actions" count={millie.length} actions={millie} onToggle={toggle} />
        <ActionSection title="Client Actions" count={client.length} actions={client} onToggle={toggle} />
        <ActionSection title="Internal / Other" count={other.length} actions={other} onToggle={toggle} />

        {showCompleted && completed.length > 0 && (
          <ActionSection title="Completed" count={completed.length} actions={completed} onToggle={toggle} />
        )}
      </div>
    </div>
  );
}

function ActionSection({
  title,
  count,
  actions,
  onToggle,
}: {
  title: string;
  count: number;
  actions: Action[];
  onToggle: (action: Action) => void;
}) {
  if (actions.length === 0) return null;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>{title}</h3>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '20px', height: '20px', borderRadius: '10px',
          background: '#F5F0E8', color: '#6B7280',
          fontSize: '11px', fontWeight: 600,
        }}>
          {count}
        </span>
      </div>
      <div style={{
        background: 'white', borderRadius: '10px',
        border: '1px solid #E8E3DB',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {actions.map((action, i) => {
          const dueDateInfo = action.status === 'Open' ? getDueDateInfo(action.due_date) : null;
          return (
            <div key={action.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '12px 16px',
              borderBottom: i < actions.length - 1 ? '1px solid #F5F0E8' : 'none',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FDFCF9')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <input type="checkbox" checked={action.status === 'Done'} onChange={() => onToggle(action)}
                style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#16a34a' }} />
              <span style={{
                flex: 1, fontSize: '13px',
                color: action.status === 'Done' ? '#D1C9BC' : '#111827',
                textDecoration: action.status === 'Done' ? 'line-through' : 'none',
              }}>
                {action.description}
              </span>
              {action.account ? (
                <Link to={`/accounts/${action.account.id}`} style={{
                  fontSize: '12px', color: '#16a34a', textDecoration: 'none',
                  fontWeight: 500, whiteSpace: 'nowrap',
                }}>
                  {action.account.company_name}
                </Link>
              ) : null}
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '3px',
                background: action.owner === 'Millie' ? '#F0FDF4' : action.owner === 'Client' ? '#EFF6FF' : '#F5F5F4',
                color: action.owner === 'Millie' ? '#15803D' : action.owner === 'Client' ? '#1D4ED8' : '#6B7280',
                whiteSpace: 'nowrap',
              }}>
                {action.owner}
              </span>
              {dueDateInfo ? (
                <span style={{
                  fontSize: '11px', fontWeight: dueDateInfo.urgent ? 600 : 400,
                  color: dueDateInfo.color, whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)',
                  background: dueDateInfo.urgent ? (dueDateInfo.color === '#DC2626' ? '#FFF1F2' : '#FFFBEB') : 'transparent',
                  padding: dueDateInfo.urgent ? '1px 6px' : '0',
                  borderRadius: '3px',
                }}>
                  {dueDateInfo.label}
                </span>
              ) : action.due_date ? (
                <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                  {new Date(action.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
