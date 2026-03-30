import { useState } from 'react';
import type { Action } from '../../lib/types';
import { updateActionStatus } from '../../services/actionsService';
import EmptyState from '../ui/EmptyState';

function getOwnerBadgeStyle(owner: string): React.CSSProperties {
  if (owner === 'Millie') {
    return { background: '#DCFCE7', color: '#15803D' };
  }
  if (owner === 'Client') {
    return { background: '#DBEAFE', color: '#1D4ED8' };
  }
  return { background: '#F5F0E8', color: '#6B7280' };
}

export default function ActionsList({
  actions,
  onRefresh,
}: {
  actions: Action[];
  onRefresh: () => void;
}) {
  const open = actions.filter((a) => a.status !== 'Done');
  const done = actions.filter((a) => a.status === 'Done');

  const toggle = async (action: Action) => {
    const newStatus = action.status === 'Done' ? 'Open' : 'Done';
    await updateActionStatus(action.id, newStatus);
    onRefresh();
  };

  if (actions.length === 0) {
    return <EmptyState message="No actions yet" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {open.length > 0 && (
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Open ({open.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {open.map((action) => (
              <ActionRow key={action.id} action={action} onToggle={() => toggle(action)} />
            ))}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Done ({done.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {done.map((action) => (
              <ActionRow key={action.id} action={action} onToggle={() => toggle(action)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionRow({ action, onToggle }: { action: Action; onToggle: () => void }) {
  const [hover, setHover] = useState(false);

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '6px',
        background: hover ? '#FDFCF9' : 'transparent',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <input
        type="checkbox"
        checked={action.status === 'Done'}
        onChange={onToggle}
        style={{ marginTop: '2px', accentColor: '#16a34a' }}
      />
      <span
        style={{
          flex: 1,
          fontSize: '13px',
          color: action.status === 'Done' ? '#9CA3AF' : '#374151',
          textDecoration: action.status === 'Done' ? 'line-through' : 'none',
        }}
      >
        {action.description}
      </span>
      <span
        style={{
          fontSize: '12px',
          padding: '2px 6px',
          borderRadius: '6px',
          ...getOwnerBadgeStyle(action.owner),
        }}
      >
        {action.owner}
      </span>
      {action.due_date && (
        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
          {new Date(action.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      )}
    </label>
  );
}
