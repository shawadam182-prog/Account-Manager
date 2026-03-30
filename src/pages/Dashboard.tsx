import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, CheckSquare } from 'lucide-react';
import type { Account, Meeting, Action } from '../lib/types';
import { getAccounts } from '../services/accountsService';
import { getRecentMeetings } from '../services/meetingsService';
import { getAllOpenActions } from '../services/actionsService';
import MembershipBadge from '../components/ui/MembershipBadge';
import RAGBadge from '../components/ui/RAGBadge';
import StatusBadge from '../components/ui/StatusBadge';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getUpcomingRenewalMonths(): string[] {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(d.toLocaleString('en-GB', { month: 'long' }));
  }
  return months;
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAccounts(), getRecentMeetings(14), getAllOpenActions()])
      .then(([a, m, act]) => {
        setAccounts(a);
        setMeetings(m);
        setActions(act);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-400 py-12 text-center">Loading...</div>;
  }

  const overdueCount = accounts.filter((a) => a.report_status === 'Overdue').length;
  const amberCount = accounts.filter((a) => a.rag_status === 'Amber').length;
  const openActionsCount = actions.length;

  const renewalMonths = getUpcomingRenewalMonths();
  const upcomingRenewals = accounts.filter(
    (a) => a.renewal_month && renewalMonths.includes(a.renewal_month)
  );

  const attentionAccounts = accounts
    .filter((a) => a.rag_status === 'Amber' || a.report_status === 'Overdue')
    .slice(0, 8);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{getGreeting()}, Millie</h1>
        <p className="text-gray-500">{today}</p>
      </div>

      {(overdueCount > 0 || amberCount > 0 || openActionsCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {overdueCount > 0 && (
            <Link
              to="/accounts?report=Overdue"
              className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-500" />
                <div>
                  <p className="text-2xl font-semibold text-red-700">{overdueCount}</p>
                  <p className="text-xs text-red-600">Overdue Reports</p>
                </div>
              </div>
            </Link>
          )}
          {amberCount > 0 && (
            <Link
              to="/accounts?rag=Amber"
              className="bg-amber-50 border border-amber-200 rounded-lg p-4 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-amber-500" />
                <div>
                  <p className="text-2xl font-semibold text-amber-700">{amberCount}</p>
                  <p className="text-xs text-amber-600">Amber RAG Accounts</p>
                </div>
              </div>
            </Link>
          )}
          {openActionsCount > 0 && (
            <Link
              to="/actions"
              className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckSquare size={20} className="text-orange-500" />
                <div>
                  <p className="text-2xl font-semibold text-orange-700">{openActionsCount}</p>
                  <p className="text-xs text-orange-600">Open Actions</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Renewals</h2>
        {upcomingRenewals.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-lg border border-gray-200 p-4">No renewals in the next 90 days.</p>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {upcomingRenewals.map((a) => (
              <Link
                key={a.id}
                to={`/accounts/${a.id}`}
                className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{a.company_name}</span>
                <div className="flex items-center gap-3">
                  <MembershipBadge level={a.membership_level} />
                  <span className="text-xs text-gray-500">{a.renewal_month}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Meetings</h2>
        {meetings.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-lg border border-gray-200 p-4">No meetings in the last 14 days.</p>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {meetings.map((m) => (
              <div key={m.id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  {m.account ? (
                    <Link to={`/accounts/${m.account.id}`} className="font-medium text-emerald-600 hover:text-emerald-700">
                      {m.account.company_name}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-500">{m.is_internal ? 'Internal' : 'External / No account'}</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(m.meeting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {m.notes && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{m.notes.split('\n')[0]}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {attentionAccounts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Accounts Needing Attention</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {attentionAccounts.map((a) => (
              <Link
                key={a.id}
                to={`/accounts/${a.id}`}
                className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{a.company_name}</span>
                <div className="flex items-center gap-2">
                  {a.report_status === 'Overdue' && <StatusBadge status={a.report_status} />}
                  {a.rag_status === 'Amber' && <RAGBadge status={a.rag_status} showLabel />}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
