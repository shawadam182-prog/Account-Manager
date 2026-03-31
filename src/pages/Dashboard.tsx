import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Clock, ListChecks, Users, CheckCircle,
  CalendarDays, TrendingUp, ArrowRight, CircleAlert,
} from 'lucide-react';
import type { Account, Meeting, Action } from '../lib/types';
import { getAccounts } from '../services/accountsService';
import { getRecentMeetings } from '../services/meetingsService';
import { getAllOpenActions } from '../services/actionsService';
import RAGBadge from '../components/ui/RAGBadge';
import HealthBadge from '../components/ui/HealthBadge';
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';
import { computeHealthScore } from '../utils/healthScore';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function getUpcomingRenewalMonths(): string[] {
  const now = new Date();
  return Array.from({ length: 3 }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth() + i, 1)
      .toLocaleString('en-GB', { month: 'long' })
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card — colourful, rounded, inspired by reference design       */
/* ------------------------------------------------------------------ */
function StatCard({
  label, value, subtitle, icon: Icon, bg, iconBg, color, to,
}: {
  label: string;
  value: number;
  subtitle?: string;
  icon: React.ElementType;
  bg: string;
  iconBg: string;
  color: string;
  to?: string;
}) {
  const card = (
    <div
      className="relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group"
      style={{ background: bg, minWidth: 0 }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
          style={{ background: iconBg }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-extrabold tracking-tight font-mono leading-none" style={{ color }}>
          {value}
        </span>
        {subtitle && (
          <span className="text-xs font-semibold mb-0.5 opacity-70" style={{ color }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="no-underline outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-2xl">
        {card}
      </Link>
    );
  }
  return card;
}

/* ------------------------------------------------------------------ */
/*  Section Card wrapper                                                */
/* ------------------------------------------------------------------ */
function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, icon: Icon, badge, action }: {
  title: string;
  icon?: React.ElementType;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={16} className="text-zinc-400" />}
        <h2 className="text-sm font-bold text-zinc-800 tracking-tight m-0">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold">
            {badge}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Priority Row                                                        */
/* ------------------------------------------------------------------ */
function PriorityRow({ dot, children, trailing, borderBottom = true }: {
  dot: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  borderBottom?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${borderBottom ? 'border-b border-zinc-50' : ''}`}>
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
      <div className="flex-1 min-w-0">{children}</div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                      */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Dashboard — Planet Mark AM';
  }, []);

  useEffect(() => {
    Promise.all([getAccounts(), getRecentMeetings(14), getAllOpenActions()])
      .then(([a, m, act]) => { setAccounts(a); setMeetings(m); setActions(act); })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 m-0">{getGreeting()}, Millie</h1>
          <p className="text-sm text-zinc-400 mt-1">{today}</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  const overdueCount = accounts.filter(a => a.report_status === 'Overdue').length;
  const amberRedCount = accounts.filter(a => a.rag_status === 'Amber' || a.rag_status === 'Red').length;
  const openActionsCount = actions.length;
  const totalAccounts = accounts.length;
  const greenCount = accounts.filter(a => a.rag_status === 'Green').length;

  const renewalMonths = getUpcomingRenewalMonths();
  const upcomingRenewals = accounts.filter(a => a.renewal_month && renewalMonths.includes(a.renewal_month));

  const attentionAccounts = accounts
    .filter(a => {
      const h = computeHealthScore(a);
      return h === 'critical' || h === 'risk';
    })
    .slice(0, 6);

  // Priorities
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const overdueActions = actions.filter(a => {
    if (a.status !== 'Open' || !a.due_date) return false;
    return new Date(a.due_date + 'T00:00:00') < todayDate;
  });

  const staleAccounts = accounts.filter(
    a => a.days_since_contact != null && a.days_since_contact > 30,
  );

  const weekFromNow = new Date(todayDate);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const dueThisWeek = actions.filter(a => {
    if (a.status !== 'Open' || !a.due_date) return false;
    const d = new Date(a.due_date + 'T00:00:00');
    return d >= todayDate && d <= weekFromNow;
  });

  const prioritiesEmpty = overdueActions.length === 0 && staleAccounts.length === 0 && dueThisWeek.length === 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } },
      }}
      className="space-y-7 pb-12"
    >
      {/* Header */}
      <motion.div variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }}>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 m-0">
          {getGreeting()}, Millie
        </h1>
        <p className="text-sm text-zinc-400 mt-1 font-medium">{today}</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Accounts"
          value={totalAccounts}
          subtitle={`${greenCount} green`}
          icon={Users}
          bg="#F3E8FF"
          iconBg="#E9D5FF"
          color="#7C3AED"
        />
        <StatCard
          label="Overdue Reports"
          value={overdueCount}
          subtitle="need action"
          icon={AlertTriangle}
          bg="#FFE4E6"
          iconBg="#FECDD3"
          color="#E11D48"
          to="/accounts?report=Overdue"
        />
        <StatCard
          label="At Risk"
          value={amberRedCount}
          subtitle="amber + red"
          icon={Clock}
          bg="#FEF3C7"
          iconBg="#FDE68A"
          color="#B45309"
          to="/accounts?rag=Amber,Red"
        />
        <StatCard
          label="Open Actions"
          value={openActionsCount}
          subtitle={overdueActions.length > 0 ? `${overdueActions.length} overdue` : 'on track'}
          icon={ListChecks}
          bg="#D1FAE5"
          iconBg="#A7F3D0"
          color="#047857"
          to="/actions"
        />
      </motion.div>

      {/* Main Grid — Priorities + Needs Attention */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* Priorities */}
        <SectionCard>
          <SectionHeader
            title="Your Priorities"
            icon={CircleAlert}
            badge={prioritiesEmpty ? undefined : `${overdueActions.length + staleAccounts.length + dueThisWeek.length}`}
          />
          {prioritiesEmpty ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle size={32} className="text-green-500 mb-2" />
              <p className="text-sm font-semibold text-zinc-700">You're all caught up!</p>
              <p className="text-xs text-zinc-400 mt-0.5">No overdue items or stale accounts.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {/* Overdue */}
              {overdueActions.length > 0 && (
                <div className="py-3">
                  <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">
                    Overdue ({overdueActions.length})
                  </p>
                  {overdueActions.slice(0, 4).map((a, i) => (
                    <PriorityRow key={a.id} dot="#E11D48" borderBottom={i < Math.min(overdueActions.length, 4) - 1}>
                      <p className="text-[13px] text-zinc-800 m-0 truncate">{a.description}</p>
                      {a.account && (
                        <Link to={`/accounts/${a.account.id}`} className="text-xs text-brand-primary hover:underline">
                          {a.account.company_name}
                        </Link>
                      )}
                    </PriorityRow>
                  ))}
                  {overdueActions.length > 4 && (
                    <Link to="/actions" className="block px-5 py-2 text-xs font-semibold text-brand-primary hover:underline">
                      View all {overdueActions.length} overdue
                    </Link>
                  )}
                </div>
              )}

              {/* Stale */}
              {staleAccounts.length > 0 && (
                <div className="py-3">
                  <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
                    Needs Contact ({staleAccounts.length})
                  </p>
                  {staleAccounts.slice(0, 4).map((a, i) => (
                    <PriorityRow
                      key={a.id}
                      dot="#D97706"
                      borderBottom={i < Math.min(staleAccounts.length, 4) - 1}
                      trailing={
                        <span className="text-[11px] text-zinc-400 font-mono">{a.days_since_contact}d</span>
                      }
                    >
                      <Link to={`/accounts/${a.id}`} className="text-[13px] font-medium text-zinc-800 hover:text-brand-primary transition-colors">
                        {a.company_name}
                      </Link>
                    </PriorityRow>
                  ))}
                </div>
              )}

              {/* Due this week */}
              {dueThisWeek.length > 0 && (
                <div className="py-3">
                  <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">
                    Due This Week ({dueThisWeek.length})
                  </p>
                  {dueThisWeek.slice(0, 4).map((a, i) => (
                    <PriorityRow
                      key={a.id}
                      dot="#3B82F6"
                      borderBottom={i < Math.min(dueThisWeek.length, 4) - 1}
                      trailing={a.due_date ? <span className="text-[11px] text-blue-500 font-mono">{formatDate(a.due_date)}</span> : undefined}
                    >
                      <p className="text-[13px] text-zinc-800 m-0 truncate">{a.description}</p>
                      {a.account && (
                        <Link to={`/accounts/${a.account.id}`} className="text-xs text-brand-primary hover:underline">
                          {a.account.company_name}
                        </Link>
                      )}
                    </PriorityRow>
                  ))}
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Needs Attention */}
        <SectionCard>
          <SectionHeader
            title="Needs Attention"
            icon={AlertTriangle}
            badge={attentionAccounts.length > 0 ? `${attentionAccounts.length}` : undefined}
            action={
              <Link to="/accounts" className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover transition-colors flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            }
          />
          {attentionAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle size={32} className="text-green-500 mb-2" />
              <p className="text-sm font-semibold text-zinc-700">All accounts healthy</p>
            </div>
          ) : (
            <div>
              {attentionAccounts.map((a, i) => (
                <Link
                  key={a.id}
                  to={`/accounts/${a.id}`}
                  className={`flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/80 transition-colors ${
                    i < attentionAccounts.length - 1 ? 'border-b border-zinc-50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-800 m-0 truncate">{a.company_name}</p>
                    {a.main_poc && <p className="text-[11px] text-zinc-400 m-0 mt-0.5">{a.main_poc}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <HealthBadge account={a} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </motion.div>

      {/* Bottom Grid — Renewals + Recent Meetings */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* Upcoming Renewals */}
        <SectionCard>
          <SectionHeader
            title="Upcoming Renewals"
            icon={CalendarDays}
            badge="90 days"
          />
          {upcomingRenewals.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm py-10">No renewals in the next 90 days</p>
          ) : (
            <div>
              {upcomingRenewals.map((a, i) => (
                <Link
                  key={a.id}
                  to={`/accounts/${a.id}`}
                  className={`flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/80 transition-colors ${
                    i < upcomingRenewals.length - 1 ? 'border-b border-zinc-50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-800 m-0 truncate">{a.company_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                      {a.renewal_month}
                    </span>
                    <RAGBadge status={a.rag_status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Recent Meetings */}
        <SectionCard>
          <SectionHeader
            title="Recent Meetings"
            icon={TrendingUp}
            badge="14 days"
          />
          {meetings.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm py-10">No meetings in the last 14 days</p>
          ) : (
            <div>
              {meetings.slice(0, 8).map((m, i) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-3.5 px-5 py-3 ${
                    i < Math.min(meetings.length, 8) - 1 ? 'border-b border-zinc-50' : ''
                  }`}
                >
                  {/* Date chip */}
                  <div className="w-11 h-11 rounded-xl bg-zinc-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-zinc-800 leading-none font-mono">
                      {new Date(m.meeting_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric' })}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">
                      {new Date(m.meeting_date + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {m.account ? (
                      <Link
                        to={`/accounts/${m.account.id}`}
                        className="text-[13px] font-semibold text-zinc-800 hover:text-brand-primary transition-colors"
                      >
                        {m.account.company_name}
                      </Link>
                    ) : (
                      <span className="text-[13px] text-zinc-400">
                        {m.is_internal ? 'Internal' : 'External'}
                      </span>
                    )}
                    {m.notes && (
                      <p className="text-xs text-zinc-400 m-0 mt-0.5 truncate">
                        {m.notes.split('\n')[0]}
                      </p>
                    )}
                  </div>
                  {m.meeting_type && (
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                      {m.meeting_type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}
