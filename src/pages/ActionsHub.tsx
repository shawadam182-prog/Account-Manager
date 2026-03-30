import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      className="space-y-8 pb-12"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h1 variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} className="text-3xl font-extrabold tracking-tight text-zinc-900 m-0 flex items-baseline gap-3">
          Actions
          <span className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">
            {openCount} open
          </span>
        </motion.h1>
        <motion.button
          variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}
          onClick={() => exportActionsCsv(filtered)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-700 bg-white/50 backdrop-blur-sm border border-zinc-200/80 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <Download size={16} className="text-zinc-500" /> Export CSV
        </motion.button>
      </div>

      <motion.div 
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        className="flex items-center gap-4 flex-wrap bg-white/70 backdrop-blur-md border border-zinc-200/80 rounded-2xl p-5 shadow-sm"
      >
        <input
          type="text"
          placeholder="Search by account or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 outline-none border border-zinc-200/80 bg-white rounded-xl text-sm font-medium text-zinc-900 w-64 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-300"
        />
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="px-4 py-2 outline-none border border-zinc-200/80 bg-white rounded-xl text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-300"
        >
          <option value="All">All owners</option>
          <option value="Millie">Millie</option>
          <option value="Client">Client</option>
          <option value="Other">Other</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 cursor-pointer select-none ml-2">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="w-4 h-4 text-brand-primary rounded border-zinc-300 focus:ring-brand-primary cursor-pointer"
          />
          Show completed
        </label>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex flex-col gap-8">
        <ActionSection title="My Actions" count={millie.length} actions={millie} onToggle={toggle} />
        <ActionSection title="Client Actions" count={client.length} actions={client} onToggle={toggle} />
        <ActionSection title="Internal / Other" count={other.length} actions={other} onToggle={toggle} />

        <AnimatePresence>
          {showCompleted && completed.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <ActionSection title="Completed" count={completed.length} actions={completed} onToggle={toggle} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
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
    <motion.section 
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
    >
      <div className="flex items-center gap-3 mb-4 pl-1">
        <h3 className="text-[15px] font-bold text-zinc-900 m-0 tracking-tight">{title}</h3>
        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-zinc-100 text-zinc-500 text-[11px] font-bold border border-zinc-200">
          {count}
        </span>
      </div>
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        {actions.map((action, i) => {
          const dueDateInfo = action.status === 'Open' ? getDueDateInfo(action.due_date) : null;
          return (
            <motion.div 
               key={action.id} 
               className={`flex items-start gap-4 p-4 border-b border-zinc-100/80 transition-colors duration-200 hover:bg-zinc-50/50 group ${i === actions.length - 1 ? 'border-none' : ''}`}
            >
              <input 
                type="checkbox" 
                checked={action.status === 'Done'} 
                onChange={() => onToggle(action)}
                className="mt-1 flex-shrink-0 cursor-pointer w-4 h-4 text-brand-primary rounded border-zinc-300 focus:ring-brand-primary transition-all duration-200" 
              />
              <span className={`flex-1 text-sm ${action.status === 'Done' ? 'text-zinc-400 line-through' : 'text-zinc-900 font-medium'} transition-all duration-300`}>
                {action.description}
              </span>
              
              <div className="flex items-center gap-3 flex-shrink-0 pt-0.5">
                {action.account ? (
                  <Link to={`/accounts/${action.account.id}`} className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover no-underline transition-colors mt-0.5">
                    {action.account.company_name}
                  </Link>
                ) : null}
                <span className={`text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap uppercase tracking-widest ${action.owner === 'Millie' ? 'bg-green-50 text-green-700 border border-green-100' : action.owner === 'Client' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>
                  {action.owner}
                </span>
                {dueDateInfo ? (
                  <span className={`text-[11px] font-bold whitespace-nowrap font-mono px-2 py-1 rounded-md ${dueDateInfo.urgent ? (dueDateInfo.color === '#DC2626' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100') : 'text-zinc-500 bg-zinc-50 border border-zinc-100'}`}>
                    {dueDateInfo.label}
                  </span>
                ) : action.due_date ? (
                  <span className="text-[11px] font-semibold text-zinc-500 whitespace-nowrap font-mono px-2 py-1 bg-zinc-50 border border-zinc-100 rounded-md">
                    {new Date(action.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
