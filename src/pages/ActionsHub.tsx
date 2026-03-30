import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Action } from '../lib/types';
import { getAllActions, getAllOpenActions, updateActionStatus } from '../services/actionsService';

export default function ActionsHub() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [showCompleted, setShowCompleted] = useState(false);

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
    await updateActionStatus(action.id, newStatus);
    loadActions();
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
    return <div className="text-gray-400 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Actions <span className="text-lg font-normal text-gray-400">({openCount} open)</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by account or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg w-64 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        >
          <option value="All">All owners</option>
          <option value="Millie">Millie</option>
          <option value="Client">Client</option>
          <option value="Other">Other</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded text-emerald-500 focus:ring-emerald-500"
          />
          Show completed
        </label>
      </div>

      <ActionSection title="My Actions" count={millie.length} actions={millie} onToggle={toggle} />
      <ActionSection title="Client Actions" count={client.length} actions={client} onToggle={toggle} />
      <ActionSection title="Internal / Other" count={other.length} actions={other} onToggle={toggle} />

      {showCompleted && completed.length > 0 && (
        <ActionSection title="Completed" count={completed.length} actions={completed} onToggle={toggle} />
      )}
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
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        {title}{' '}
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
          {count}
        </span>
      </h3>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {actions.map((action) => (
          <div key={action.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={action.status === 'Done'}
              onChange={() => onToggle(action)}
              className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500"
            />
            <span className={`flex-1 text-sm ${action.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {action.description}
            </span>
            {action.account ? (
              <Link
                to={`/accounts/${action.account.id}`}
                className="text-xs text-emerald-600 hover:text-emerald-700 whitespace-nowrap"
              >
                {action.account.company_name}
              </Link>
            ) : (
              <span className="text-xs text-gray-400">No account</span>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${
              action.owner === 'Millie' ? 'bg-emerald-100 text-emerald-700' : action.owner === 'Client' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {action.owner}
            </span>
            {action.due_date && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(action.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
