import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Download, ChevronDown, ChevronRight, SlidersHorizontal,
  ArrowUpDown, MessageSquare, X, Plus,
} from 'lucide-react';
import type { Action, ActionPriority, ActionCategory } from '../lib/types';
import { getAllActions, getAllOpenActions, updateActionStatus, updateAction } from '../services/actionsService';
import { exportActionsCsv } from '../utils/csvExport';
import AddActionForm from '../components/actions/AddActionForm';

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const PRIORITY_CONFIG: Record<ActionPriority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  High:   { label: 'High',   color: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200',   dot: 'bg-red-500' },
  Medium: { label: 'Medium', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  Low:    { label: 'Low',    color: 'text-zinc-600',  bg: 'bg-zinc-50',  border: 'border-zinc-200',  dot: 'bg-zinc-400' },
};

const CATEGORY_OPTIONS: ActionCategory[] = ['Follow-up', 'Data request', 'Internal task', 'Client deliverable', 'Renewal', 'Other'];

const STATUS_CONFIG = {
  Open:    { label: 'Open',    color: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200' },
  Blocked: { label: 'Blocked', color: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200' },
  Done:    { label: 'Done',    color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
};

type SortKey = 'due_date' | 'priority' | 'created_at' | 'account';
type GroupKey = 'status' | 'owner' | 'priority' | 'account' | 'category';

function getDueDateInfo(dueDate: string | null): { label: string; color: string; badgeCls: string; urgent: boolean } | null {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: 'text-red-700', badgeCls: 'bg-red-50 border-red-100', urgent: true };
  if (diffDays === 0) return { label: 'Due today', color: 'text-amber-700', badgeCls: 'bg-amber-50 border-amber-100', urgent: true };
  if (diffDays <= 3) return { label: `Due in ${diffDays}d`, color: 'text-amber-600', badgeCls: 'bg-amber-50 border-amber-100', urgent: false };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, color: 'text-blue-600', badgeCls: 'bg-blue-50 border-blue-100', urgent: false };
  return { label: formatDate(dueDate), color: 'text-zinc-500', badgeCls: 'bg-zinc-50 border-zinc-100', urgent: false };
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const PRIORITY_SORT_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function sortActions(actions: Action[], key: SortKey): Action[] {
  return [...actions].sort((a, b) => {
    switch (key) {
      case 'due_date': {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      case 'priority':
        return (PRIORITY_SORT_ORDER[a.priority] ?? 1) - (PRIORITY_SORT_ORDER[b.priority] ?? 1);
      case 'account':
        return (a.account?.company_name ?? '').localeCompare(b.account?.company_name ?? '');
      case 'created_at':
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });
}

function groupActions(actions: Action[], key: GroupKey): { label: string; actions: Action[] }[] {
  const map = new Map<string, Action[]>();
  for (const a of actions) {
    let k: string;
    switch (key) {
      case 'owner':    k = a.owner; break;
      case 'priority': k = a.priority || 'Medium'; break;
      case 'account':  k = a.account?.company_name || 'Unlinked'; break;
      case 'category': k = a.category || 'Uncategorised'; break;
      case 'status':
      default:         k = a.status; break;
    }
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(a);
  }

  // Sort groups sensibly
  const order = key === 'status' ? ['Open', 'Blocked', 'Done']
    : key === 'priority' ? ['High', 'Medium', 'Low']
    : undefined;

  if (order) {
    const result: { label: string; actions: Action[] }[] = [];
    for (const k of order) {
      if (map.has(k)) result.push({ label: k, actions: map.get(k)! });
    }
    // anything not in the predefined order
    for (const [k, v] of map) {
      if (!order.includes(k)) result.push({ label: k, actions: v });
    }
    return result;
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([label, actions]) => ({ label, actions }));
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ActionsHub() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('priority');
  const [groupBy, setGroupBy] = useState<GroupKey>('status');
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [showAddAction, setShowAddAction] = useState(false);

  useEffect(() => { document.title = 'Actions — Planet Mark AM'; }, []);

  const loadActions = async () => {
    const data = showCompleted ? await getAllActions() : await getAllOpenActions();
    setActions(data);
    setLoading(false);
  };

  useEffect(() => { loadActions(); }, [showCompleted]);

  const toggleStatus = async (action: Action) => {
    const newStatus = action.status === 'Done' ? 'Open' : 'Done';
    setActions(prev => prev.map(a =>
      a.id === action.id ? { ...a, status: newStatus, completed_at: newStatus === 'Done' ? new Date().toISOString() : null } : a
    ));
    try { await updateActionStatus(action.id, newStatus); }
    catch { setActions(prev => prev.map(a => a.id === action.id ? action : a)); }
  };

  const setBlocked = async (action: Action) => {
    const newStatus = action.status === 'Blocked' ? 'Open' : 'Blocked';
    setActions(prev => prev.map(a =>
      a.id === action.id ? { ...a, status: newStatus } : a
    ));
    try { await updateActionStatus(action.id, newStatus); }
    catch { setActions(prev => prev.map(a => a.id === action.id ? action : a)); }
  };

  const updatePriority = async (action: Action, priority: ActionPriority) => {
    setActions(prev => prev.map(a => a.id === action.id ? { ...a, priority } : a));
    await updateAction(action.id, { priority });
  };

  // Filtering
  const filtered = actions.filter(a => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!a.description.toLowerCase().includes(term) && !(a.account?.company_name ?? '').toLowerCase().includes(term)) return false;
    }
    if (ownerFilter !== 'All') {
      if (ownerFilter === 'Other') { if (a.owner === 'Millie' || a.owner === 'Client') return false; }
      else if (a.owner !== ownerFilter) return false;
    }
    if (priorityFilter !== 'All' && a.priority !== priorityFilter) return false;
    if (categoryFilter !== 'All' && a.category !== categoryFilter) return false;
    return true;
  });

  const sorted = sortActions(filtered, sortBy);

  // Split into general (unlinked) and account-linked actions
  const generalActions = sorted.filter(a => a.account_id === null);
  const accountActions = sorted.filter(a => a.account_id !== null);
  const generalGroups = groupActions(generalActions, groupBy);
  const accountGroups = groupActions(accountActions, groupBy);

  const openCount = actions.filter(a => a.status === 'Open').length;
  const blockedCount = actions.filter(a => a.status === 'Blocked').length;
  const hasActiveFilters = ownerFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All' || searchTerm;

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-zinc-400">Loading...</div>;
  }

  return (
    <motion.div
      initial="hidden" animate="show"
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <motion.div variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 m-0">Actions</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-semibold text-zinc-500">{openCount} open</span>
            {blockedCount > 0 && (
              <span className="text-sm font-semibold text-red-500">{blockedCount} blocked</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddAction(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover border-none rounded-xl cursor-pointer transition-colors"
          >
            <Plus size={15} /> Add Action
          </button>
          <button
            onClick={() => exportActionsCsv(filtered)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:shadow-sm transition-all cursor-pointer"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
        className="grid grid-cols-3 gap-3"
      >
        {(['High', 'Medium', 'Low'] as ActionPriority[]).map(p => {
          const count = actions.filter(a => a.priority === p && a.status !== 'Done').length;
          const cfg = PRIORITY_CONFIG[p];
          return (
            <button
              key={p}
              onClick={() => setPriorityFilter(priorityFilter === p ? 'All' : p)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                priorityFilter === p ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm` : 'bg-white border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              <div className="text-left">
                <span className="text-lg font-bold font-mono leading-none block">{count}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{p} Priority</span>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* Filters & Controls */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
        className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search actions or accounts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 outline-none border border-zinc-200 bg-white rounded-xl text-sm font-medium text-zinc-900 w-60 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />

          <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}
            className="px-3 py-2 outline-none border border-zinc-200 bg-white rounded-xl text-sm font-medium text-zinc-700 focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer">
            <option value="All">All owners</option>
            <option value="Millie">Millie</option>
            <option value="Client">Client</option>
            <option value="Other">Other</option>
          </select>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 outline-none border border-zinc-200 bg-white rounded-xl text-sm font-medium text-zinc-700 focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer">
            <option value="All">All categories</option>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-xl bg-white">
            <ArrowUpDown size={13} className="text-zinc-400" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
              className="outline-none text-sm font-medium text-zinc-700 bg-transparent cursor-pointer border-none p-0">
              <option value="priority">Priority</option>
              <option value="due_date">Due date</option>
              <option value="created_at">Newest</option>
              <option value="account">Account</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-xl bg-white">
            <SlidersHorizontal size={13} className="text-zinc-400" />
            <select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupKey)}
              className="outline-none text-sm font-medium text-zinc-700 bg-transparent cursor-pointer border-none p-0">
              <option value="status">Group: Status</option>
              <option value="owner">Group: Owner</option>
              <option value="priority">Group: Priority</option>
              <option value="account">Group: Account</option>
              <option value="category">Group: Category</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-600 cursor-pointer select-none ml-auto">
            <input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)}
              className="w-3.5 h-3.5 text-brand-primary rounded border-zinc-300 focus:ring-brand-primary cursor-pointer" />
            Show completed
          </label>

          {hasActiveFilters && (
            <button
              onClick={() => { setSearchTerm(''); setOwnerFilter('All'); setPriorityFilter('All'); setCategoryFilter('All'); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
            >
              <X size={12} strokeWidth={3} /> Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Add Action form */}
      {showAddAction && (
        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <AddActionForm
            accountId={null}
            onSaved={() => { setShowAddAction(false); loadActions(); }}
            onCancel={() => setShowAddAction(false)}
          />
        </motion.div>
      )}

      {/* General Actions */}
      {generalGroups.length > 0 && (
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pl-1">
            <h2 className="text-base font-bold text-zinc-800 m-0 tracking-tight">General Actions</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
              {generalActions.length}
            </span>
          </div>
          {generalGroups.map(group => (
            <ActionGroup
              key={'general-' + group.label}
              label={group.label}
              actions={group.actions}
              onToggleStatus={toggleStatus}
              onToggleBlocked={setBlocked}
              onUpdatePriority={updatePriority}
              expandedNote={expandedNote}
              onToggleNote={id => setExpandedNote(expandedNote === id ? null : id)}
            />
          ))}
        </motion.div>
      )}

      {/* Account Actions */}
      {accountGroups.length > 0 && (
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pl-1">
            <h2 className="text-base font-bold text-zinc-800 m-0 tracking-tight">Account Actions</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
              {accountActions.length}
            </span>
          </div>
          {accountGroups.map(group => (
            <ActionGroup
              key={'account-' + group.label}
              label={group.label}
              actions={group.actions}
              onToggleStatus={toggleStatus}
              onToggleBlocked={setBlocked}
              onUpdatePriority={updatePriority}
              expandedNote={expandedNote}
              onToggleNote={id => setExpandedNote(expandedNote === id ? null : id)}
            />
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {generalGroups.length === 0 && accountGroups.length === 0 && (
        <div className="text-center py-16 text-zinc-400 text-sm">No actions match your filters.</div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Action Group                                                        */
/* ------------------------------------------------------------------ */

function ActionGroup({ label, actions, onToggleStatus, onToggleBlocked, onUpdatePriority, expandedNote, onToggleNote }: {
  label: string;
  actions: Action[];
  onToggleStatus: (a: Action) => void;
  onToggleBlocked: (a: Action) => void;
  onUpdatePriority: (a: Action, p: ActionPriority) => void;
  expandedNote: string | null;
  onToggleNote: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(label === 'Done');

  const statusCfg = STATUS_CONFIG[label as keyof typeof STATUS_CONFIG];
  const priorityCfg = PRIORITY_CONFIG[label as keyof typeof PRIORITY_CONFIG];

  return (
    <section>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2.5 mb-3 pl-1 cursor-pointer bg-transparent border-none p-0 group"
      >
        {collapsed ? <ChevronRight size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
        <h3 className="text-sm font-bold text-zinc-800 m-0 tracking-tight">{label}</h3>
        <span className={`inline-flex items-center justify-center min-w-[22px] h-5.5 px-2 rounded-full text-[10px] font-bold border ${
          statusCfg ? `${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}` :
          priorityCfg ? `${priorityCfg.bg} ${priorityCfg.color} ${priorityCfg.border}` :
          'bg-zinc-100 text-zinc-500 border-zinc-200'
        }`}>
          {actions.length}
        </span>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
              {actions.map((action, i) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  isLast={i === actions.length - 1}
                  onToggleStatus={() => onToggleStatus(action)}
                  onToggleBlocked={() => onToggleBlocked(action)}
                  onUpdatePriority={(p) => onUpdatePriority(action, p)}
                  noteExpanded={expandedNote === action.id}
                  onToggleNote={() => onToggleNote(action.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Action Card                                                         */
/* ------------------------------------------------------------------ */

function ActionCard({ action, isLast, onToggleStatus, onToggleBlocked, onUpdatePriority, noteExpanded, onToggleNote }: {
  action: Action;
  isLast: boolean;
  onToggleStatus: () => void;
  onToggleBlocked: () => void;
  onUpdatePriority: (p: ActionPriority) => void;
  noteExpanded: boolean;
  onToggleNote: () => void;
}) {
  const isDone = action.status === 'Done';
  const isBlocked = action.status === 'Blocked';
  const dueDateInfo = !isDone ? getDueDateInfo(action.due_date) : null;
  const pCfg = PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.Medium;

  return (
    <div className={`${!isLast ? 'border-b border-zinc-100' : ''} transition-colors hover:bg-zinc-50/50`}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Priority strip */}
        <div className={`w-1 self-stretch rounded-full shrink-0 ${pCfg.dot} ${isDone ? 'opacity-30' : ''}`} />

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isDone}
          onChange={onToggleStatus}
          className="mt-1 shrink-0 cursor-pointer w-4 h-4 text-brand-primary rounded border-zinc-300 focus:ring-brand-primary"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <span className={`text-sm leading-snug ${isDone ? 'text-zinc-400 line-through' : isBlocked ? 'text-zinc-500' : 'text-zinc-900 font-medium'}`}>
              {action.description}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {action.account && (
              <Link to={`/accounts/${action.account.id}`} className="text-[11px] font-semibold text-brand-primary hover:underline">
                {action.account.company_name}
              </Link>
            )}
            {action.category && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                {action.category}
              </span>
            )}
            {action.notes && (
              <button
                onClick={onToggleNote}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-zinc-600 bg-transparent border-none cursor-pointer p-0"
              >
                <MessageSquare size={10} />
                Note
              </button>
            )}
          </div>
        </div>

        {/* Right side badges */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {/* Status badge for blocked */}
          {isBlocked && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">
              Blocked
            </span>
          )}

          {/* Priority selector */}
          <select
            value={action.priority || 'Medium'}
            onChange={e => onUpdatePriority(e.target.value as ActionPriority)}
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border cursor-pointer outline-none appearance-none text-center ${pCfg.bg} ${pCfg.color} ${pCfg.border} ${isDone ? 'opacity-40' : ''}`}
            disabled={isDone}
          >
            <option value="High">High</option>
            <option value="Medium">Med</option>
            <option value="Low">Low</option>
          </select>

          {/* Owner */}
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider whitespace-nowrap ${
            action.owner === 'Millie' ? 'bg-green-50 text-green-700 border-green-200' :
            action.owner === 'Client' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            'bg-zinc-100 text-zinc-600 border-zinc-200'
          } ${isDone ? 'opacity-40' : ''}`}>
            {action.owner}
          </span>

          {/* Due date */}
          {dueDateInfo && (
            <span className={`text-[10px] font-bold font-mono px-2 py-1 rounded-lg border whitespace-nowrap ${dueDateInfo.color} ${dueDateInfo.badgeCls}`}>
              {dueDateInfo.label}
            </span>
          )}

          {/* Block/unblock */}
          {!isDone && (
            <button
              onClick={onToggleBlocked}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer transition-colors ${
                isBlocked
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
              }`}
              title={isBlocked ? 'Unblock' : 'Mark as blocked'}
            >
              {isBlocked ? 'Unblock' : 'Block'}
            </button>
          )}
        </div>
      </div>

      {/* Expanded note */}
      <AnimatePresence>
        {noteExpanded && action.notes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-12 pb-3">
              <p className="text-xs text-zinc-500 bg-zinc-50 rounded-lg p-3 m-0 leading-relaxed border border-zinc-100">
                {action.notes}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
