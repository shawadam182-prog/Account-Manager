import type { Action, ActionPriority } from '../../lib/types';
import { updateActionStatus, updateAction } from '../../services/actionsService';
import EmptyState from '../ui/EmptyState';

const PRIORITY_CONFIG: Record<string, { dot: string; bg: string; color: string; border: string }> = {
  High:   { dot: 'bg-red-500',   bg: 'bg-red-50',   color: 'text-red-700',   border: 'border-red-200' },
  Medium: { dot: 'bg-amber-500', bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-200' },
  Low:    { dot: 'bg-zinc-400',  bg: 'bg-zinc-50',  color: 'text-zinc-600',  border: 'border-zinc-200' },
};

function getDueBadge(dueDate: string | null) {
  if (!dueDate) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, cls: 'text-red-600 bg-red-50 border-red-100' };
  if (diff === 0) return { label: 'Today', cls: 'text-amber-600 bg-amber-50 border-amber-100' };
  if (diff <= 7) return { label: `${diff}d`, cls: 'text-blue-600 bg-blue-50 border-blue-100' };
  return { label: new Date(dueDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), cls: 'text-zinc-500 bg-zinc-50 border-zinc-100' };
}

export default function ActionsList({ actions, onRefresh }: { actions: Action[]; onRefresh: () => void }) {
  const open = actions.filter(a => a.status === 'Open');
  const blocked = actions.filter(a => a.status === 'Blocked');
  const done = actions.filter(a => a.status === 'Done');

  const toggle = async (action: Action) => {
    const newStatus = action.status === 'Done' ? 'Open' : 'Done';
    await updateActionStatus(action.id, newStatus);
    onRefresh();
  };

  const toggleBlocked = async (action: Action) => {
    const newStatus = action.status === 'Blocked' ? 'Open' : 'Blocked';
    await updateActionStatus(action.id, newStatus);
    onRefresh();
  };

  const changePriority = async (action: Action, priority: ActionPriority) => {
    await updateAction(action.id, { priority });
    onRefresh();
  };

  if (actions.length === 0) {
    return <EmptyState message="No actions yet" />;
  }

  return (
    <div className="flex flex-col gap-5">
      {open.length > 0 && (
        <ActionSection label="Open" count={open.length} badgeCls="bg-blue-50 text-blue-700 border-blue-200">
          {open.map((a, i) => (
            <ActionRow key={a.id} action={a} isLast={i === open.length - 1} onToggle={() => toggle(a)} onToggleBlocked={() => toggleBlocked(a)} onChangePriority={p => changePriority(a, p)} />
          ))}
        </ActionSection>
      )}
      {blocked.length > 0 && (
        <ActionSection label="Blocked" count={blocked.length} badgeCls="bg-red-50 text-red-700 border-red-200">
          {blocked.map((a, i) => (
            <ActionRow key={a.id} action={a} isLast={i === blocked.length - 1} onToggle={() => toggle(a)} onToggleBlocked={() => toggleBlocked(a)} onChangePriority={p => changePriority(a, p)} />
          ))}
        </ActionSection>
      )}
      {done.length > 0 && (
        <ActionSection label="Done" count={done.length} badgeCls="bg-green-50 text-green-700 border-green-200">
          {done.map((a, i) => (
            <ActionRow key={a.id} action={a} isLast={i === done.length - 1} onToggle={() => toggle(a)} onToggleBlocked={() => toggleBlocked(a)} onChangePriority={p => changePriority(a, p)} />
          ))}
        </ActionSection>
      )}
    </div>
  );
}

function ActionSection({ label, count, badgeCls, children }: { label: string; count: number; badgeCls: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 m-0">{label}</h4>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${badgeCls}`}>{count}</span>
      </div>
      <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );
}

function ActionRow({ action, isLast, onToggle, onToggleBlocked, onChangePriority }: {
  action: Action;
  isLast: boolean;
  onToggle: () => void;
  onToggleBlocked: () => void;
  onChangePriority: (p: ActionPriority) => void;
}) {
  const isDone = action.status === 'Done';
  const isBlocked = action.status === 'Blocked';
  const pCfg = PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.Medium;
  const dueBadge = !isDone ? getDueBadge(action.due_date) : null;

  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 hover:bg-zinc-50/50 transition-colors ${!isLast ? 'border-b border-zinc-100' : ''}`}>
      {/* Priority strip */}
      <div className={`w-1 self-stretch rounded-full shrink-0 ${pCfg.dot} ${isDone ? 'opacity-25' : ''}`} />

      <input
        type="checkbox"
        checked={isDone}
        onChange={onToggle}
        className="mt-0.5 shrink-0 cursor-pointer w-3.5 h-3.5 text-brand-primary rounded border-zinc-300 focus:ring-brand-primary"
      />

      <div className="flex-1 min-w-0">
        <span className={`text-[13px] leading-snug ${isDone ? 'text-zinc-400 line-through' : isBlocked ? 'text-zinc-500' : 'text-zinc-800 font-medium'}`}>
          {action.description}
        </span>
        {/* Meta */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {action.category && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
              {action.category}
            </span>
          )}
          {action.notes && (
            <span className="text-[9px] text-zinc-400 italic truncate max-w-[200px]">{action.notes}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isBlocked && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 uppercase">Blocked</span>
        )}

        <select
          value={action.priority || 'Medium'}
          onChange={e => onChangePriority(e.target.value as ActionPriority)}
          disabled={isDone}
          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border cursor-pointer outline-none appearance-none ${pCfg.bg} ${pCfg.color} ${pCfg.border} ${isDone ? 'opacity-30' : ''}`}
        >
          <option value="High">High</option>
          <option value="Medium">Med</option>
          <option value="Low">Low</option>
        </select>

        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
          action.owner === 'Millie' ? 'bg-green-50 text-green-700 border-green-200' :
          action.owner === 'Client' ? 'bg-blue-50 text-blue-700 border-blue-200' :
          'bg-zinc-100 text-zinc-600 border-zinc-200'
        } ${isDone ? 'opacity-30' : ''}`}>
          {action.owner}
        </span>

        {dueBadge && (
          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${dueBadge.cls}`}>
            {dueBadge.label}
          </span>
        )}

        {!isDone && (
          <button
            onClick={onToggleBlocked}
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-pointer transition-colors ${
              isBlocked ? 'bg-green-50 text-green-700 border-green-200' : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
            }`}
          >
            {isBlocked ? 'Unblock' : 'Block'}
          </button>
        )}
      </div>
    </div>
  );
}
