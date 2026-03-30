import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ListChecks, TrendingUp, CalendarDays, Users, CheckCircle } from 'lucide-react';
import type { Account, Meeting, Action } from '../lib/types';
import { getAccounts } from '../services/accountsService';
import { getRecentMeetings } from '../services/meetingsService';
import { getAllOpenActions } from '../services/actionsService';
import MembershipBadge from '../components/ui/MembershipBadge';
import RAGBadge from '../components/ui/RAGBadge';
import StatusBadge from '../components/ui/StatusBadge';
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

function StatCard({
  label, value, sub, color, icon: Icon, to,
}: {
  label: string; value: number; sub?: string;
  color: string; icon: React.ElementType; to?: string;
}) {
  const content = (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
      }}
      whileHover={to ? { y: -4, scale: 1.015 } : undefined}
      className={`relative overflow-hidden bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-zinc-200/80 shadow-sm transition-shadow duration-300 ${to ? 'cursor-pointer hover:shadow-xl hover:border-zinc-300/80 group' : ''}`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
            {label}
          </p>
          <p className="text-4xl font-extrabold text-zinc-900 tracking-tighter font-mono leading-none">
            {value}
          </p>
          {sub && <p className="text-xs font-semibold text-zinc-400 mt-2">{sub}</p>}
        </div>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ background: color + '15' }}
        >
          <Icon size={22} color={color} />
        </div>
      </div>
      {/* Decorative gradient overlay */}
      <div 
        className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: color }}
      />
    </motion.div>
  );

  if (to) return <Link to={to} className="block outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-2xl">{content}</Link>;
  return content;
}

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

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
            {getGreeting()}, Millie
          </h1>
          <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '3px' }}>
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <div className="stat-grid" style={{ marginBottom: '28px' }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  const overdueCount = accounts.filter(a => a.report_status === 'Overdue').length;
  const amberRedCount = accounts.filter(a => a.rag_status === 'Amber' || a.rag_status === 'Red').length;
  const openActionsCount = actions.length;
  const totalAccounts = accounts.length;

  const renewalMonths = getUpcomingRenewalMonths();
  const upcomingRenewals = accounts.filter(a => a.renewal_month && renewalMonths.includes(a.renewal_month));

  const attentionAccounts = accounts
    .filter(a => {
      const h = computeHealthScore(a);
      return h === 'critical' || h === 'risk';
    })
    .slice(0, 6);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // --- Priorities data ---
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const overdueActions = actions.filter(a => {
    if (a.status !== 'Open' || !a.due_date) return false;
    const d = new Date(a.due_date + 'T00:00:00');
    return d < todayDate;
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

  const prioritiesEmpty =
    overdueActions.length === 0 &&
    staleAccounts.length === 0 &&
    dueThisWeek.length === 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short',
    });

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
      <motion.div 
        variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 m-0">
          {getGreeting()}, Millie
        </h1>
        <p className="text-sm font-semibold text-zinc-500 mt-2 uppercase tracking-widest">{today}</p>
      </motion.div>

      <motion.div 
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        className="stat-grid"
      >
        <StatCard label="Total Accounts" value={totalAccounts} sub="in your portfolio" color="#6366F1" icon={Users} />
        <StatCard label="Overdue Reports" value={overdueCount} sub="need action" color="#DC2626" icon={AlertTriangle} to="/accounts?report=Overdue" />
        <StatCard label="At Risk / Amber" value={amberRedCount} sub="accounts flagged" color="#D97706" icon={Clock} to="/accounts?rag=Amber,Red" />
        <StatCard label="Open Actions" value={openActionsCount} sub="to complete" color="#16A34A" icon={ListChecks} to="/actions" />
      </motion.div>

      {/* ===== Your Priorities Today ===== */}
      <motion.div 
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200/80 p-8 shadow-sm hover:shadow-lg transition-shadow duration-300"
      >
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
          Your Priorities Today
        </h2>

        {prioritiesEmpty ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '32px 0', color: '#9CA3AF',
          }}>
            <CheckCircle size={36} style={{ marginBottom: '10px', color: '#16a34a' }} />
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>You're all caught up!</p>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>No overdue actions, stale accounts, or upcoming deadlines.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Overdue Actions */}
            {overdueActions.length > 0 && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#DC2626', marginBottom: '8px' }}>
                  Overdue Actions ({overdueActions.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  {overdueActions.slice(0, 5).map(a => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 0',
                        borderBottom: '1px solid #F5F0E8',
                      }}
                    >
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#DC2626', flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.description}
                        </p>
                        {a.account && (
                          <Link
                            to={`/accounts/${a.account.id}`}
                            style={{ fontSize: '12px', color: '#16a34a', textDecoration: 'none' }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            {a.account.company_name}
                          </Link>
                        )}
                      </div>
                      {a.due_date && (
                        <span style={{ fontSize: '11px', color: '#DC2626', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                          {formatDate(a.due_date)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {overdueActions.length > 5 && (
                  <Link to="/actions" style={{ fontSize: '12px', color: '#16a34a', textDecoration: 'none', marginTop: '6px', display: 'inline-block' }}>
                    View all {overdueActions.length} overdue →
                  </Link>
                )}
              </div>
            )}

            {/* Stale Accounts */}
            {staleAccounts.length > 0 && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D97706', marginBottom: '8px' }}>
                  Stale Accounts ({staleAccounts.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  {staleAccounts.slice(0, 5).map(a => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 0',
                        borderBottom: '1px solid #F5F0E8',
                      }}
                    >
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#D97706', flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          to={`/accounts/${a.id}`}
                          style={{ fontSize: '13px', fontWeight: 500, color: '#111827', textDecoration: 'none' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#16a34a')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#111827')}
                        >
                          {a.company_name}
                        </Link>
                      </div>
                      <span style={{ fontSize: '12px', color: '#9CA3AF', flexShrink: 0 }}>
                        {a.days_since_contact} days since last contact
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Due This Week */}
            {dueThisWeek.length > 0 && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3B82F6', marginBottom: '8px' }}>
                  Due This Week ({dueThisWeek.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  {dueThisWeek.slice(0, 5).map(a => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 0',
                        borderBottom: '1px solid #F5F0E8',
                      }}
                    >
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#3B82F6', flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.description}
                        </p>
                        {a.account && (
                          <Link
                            to={`/accounts/${a.account.id}`}
                            style={{ fontSize: '12px', color: '#16a34a', textDecoration: 'none' }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            {a.account.company_name}
                          </Link>
                        )}
                      </div>
                      {a.due_date && (
                        <span style={{ fontSize: '11px', color: '#3B82F6', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                          {formatDate(a.due_date)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </motion.div>

      <motion.div 
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        className="section-grid"
      >
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[15px] font-bold text-zinc-900 tracking-tight">Needs Attention</h2>
            <Link to="/accounts" className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover transition-colors">
              View all →
            </Link>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
            {attentionAccounts.length === 0 ? (
              <p style={{ padding: '24px', color: '#9CA3AF', fontSize: '13px', textAlign: 'center' }}>
                No accounts flagged as at risk
              </p>
            ) : (
              attentionAccounts.map((a, i) => (
                <Link
                  key={a.id}
                  to={`/accounts/${a.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: i < attentionAccounts.length - 1 ? '1px solid #F5F0E8' : 'none',
                    textDecoration: 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FDFCF9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{a.company_name}</p>
                    {a.main_poc && <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>{a.main_poc}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HealthBadge account={a} />
                    {a.report_status === 'Overdue' && <StatusBadge status={a.report_status} />}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[15px] font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-500" />
              Upcoming Renewals
            </h2>
            <span className="text-xs font-semibold text-zinc-500">Next 90 days</span>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
            {upcomingRenewals.length === 0 ? (
              <p style={{ padding: '24px', color: '#9CA3AF', fontSize: '13px', textAlign: 'center' }}>
                No renewals in the next 90 days
              </p>
            ) : (
              upcomingRenewals.map((a, i) => (
                <Link
                  key={a.id}
                  to={`/accounts/${a.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: i < upcomingRenewals.length - 1 ? '1px solid #F5F0E8' : 'none',
                    textDecoration: 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FDFCF9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{a.company_name}</p>
                    <MembershipBadge level={a.membership_level} compact />
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 600, color: '#6366F1',
                      background: '#EEF2FF', padding: '2px 8px', borderRadius: '4px',
                    }}>
                      {a.renewal_month}
                    </span>
                    <RAGBadge status={a.rag_status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 mt-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[15px] font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-primary" />
              Recent Meetings
            </h2>
            <span className="text-xs font-semibold text-zinc-500">Last 14 days</span>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
            {meetings.length === 0 ? (
              <p style={{ padding: '24px', color: '#9CA3AF', fontSize: '13px', textAlign: 'center' }}>
                No meetings logged in the last 14 days
              </p>
            ) : (
              meetings.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px 16px',
                    borderBottom: i < meetings.length - 1 ? '1px solid #F5F0E8' : 'none',
                  }}
                >
                  <div style={{
                    minWidth: '52px', textAlign: 'center',
                    padding: '4px 6px', borderRadius: '6px',
                    background: '#F5F3EE', border: '1px solid #E8E3DB',
                  }}>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
                      {new Date(m.meeting_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>
                      {new Date(m.meeting_date + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short' })}
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {m.account ? (
                      <Link
                        to={`/accounts/${m.account.id}`}
                        style={{ fontSize: '13px', fontWeight: 600, color: '#111827', textDecoration: 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#16a34a')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#111827')}
                      >
                        {m.account.company_name}
                      </Link>
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#9CA3AF' }}>
                        {m.is_internal ? 'Internal meeting' : 'External'}
                      </span>
                    )}
                    {m.notes && (
                      <p style={{
                        fontSize: '12px', color: '#9CA3AF', marginTop: '2px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {m.notes.split('\n')[0]}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
