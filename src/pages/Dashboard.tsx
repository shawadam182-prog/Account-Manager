import { useEffect, useState } from 'react';
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
    <div style={{
      background: 'white', borderRadius: '10px',
      border: '1px solid #E8E3DB',
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      transition: to ? 'box-shadow 0.15s ease, transform 0.1s ease' : undefined,
      cursor: to ? 'pointer' : 'default',
    }}
    onMouseEnter={(e) => {
      if (!to) return;
      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
    }}
    >
      <div>
        <p style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: '8px' }}>
          {label}
        </p>
        <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>{sub}</p>}
      </div>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
    </div>
  );

  if (to) return <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>{content}</Link>;
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
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
          {getGreeting()}, Millie
        </h1>
        <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '3px' }}>{today}</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: '28px' }}>
        <StatCard label="Total Accounts" value={totalAccounts} sub="in your portfolio" color="#6366F1" icon={Users} />
        <StatCard label="Overdue Reports" value={overdueCount} sub="need action" color="#DC2626" icon={AlertTriangle} to="/accounts?report=Overdue" />
        <StatCard label="At Risk / Amber" value={amberRedCount} sub="accounts flagged" color="#D97706" icon={Clock} to="/accounts?rag=Amber,Red" />
        <StatCard label="Open Actions" value={openActionsCount} sub="to complete" color="#16A34A" icon={ListChecks} to="/actions" />
      </div>

      {/* ===== Your Priorities Today ===== */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        border: '1px solid #E8E3DB',
        padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        marginBottom: '28px',
      }}>
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
      </div>

      <div className="section-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Needs Attention</h2>
            <Link to="/accounts" style={{ fontSize: '12px', color: '#16a34a', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div style={{
            background: 'white', borderRadius: '10px',
            border: '1px solid #E8E3DB',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={16} color="#6366F1" />
              Upcoming Renewals
            </h2>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Next 90 days</span>
          </div>
          <div style={{
            background: 'white', borderRadius: '10px',
            border: '1px solid #E8E3DB',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
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

        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <TrendingUp size={16} color="#16a34a" />
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Recent Meetings</h2>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Last 14 days</span>
          </div>
          <div style={{
            background: 'white', borderRadius: '10px',
            border: '1px solid #E8E3DB',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
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
      </div>
    </div>
  );
}
