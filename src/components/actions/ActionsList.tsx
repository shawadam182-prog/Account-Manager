import type { Action } from '../../lib/types';
import { updateActionStatus } from '../../services/actionsService';
import EmptyState from '../ui/EmptyState';

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
    <div className="space-y-4">
      {open.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Open ({open.length})</h4>
          <div className="space-y-1.5">
            {open.map((action) => (
              <ActionRow key={action.id} action={action} onToggle={() => toggle(action)} />
            ))}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Done ({done.length})</h4>
          <div className="space-y-1.5">
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
  return (
    <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
      <input
        type="checkbox"
        checked={action.status === 'Done'}
        onChange={onToggle}
        className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500"
      />
      <span className={`flex-1 text-sm ${action.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        {action.description}
      </span>
      <span className={`text-xs px-1.5 py-0.5 rounded ${action.owner === 'Millie' ? 'bg-emerald-100 text-emerald-700' : action.owner === 'Client' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
        {action.owner}
      </span>
      {action.due_date && (
        <span className="text-xs text-gray-400">
          {new Date(action.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      )}
    </label>
  );
}
