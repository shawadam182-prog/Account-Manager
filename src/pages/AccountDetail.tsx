import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import type { Account, Meeting, Action } from '../lib/types';
import { getAccount, updateAccount } from '../services/accountsService';
import { getMeetingsForAccount } from '../services/meetingsService';
import { getActionsForAccount } from '../services/actionsService';
import InlineEdit from '../components/ui/InlineEdit';
import RAGBadge from '../components/ui/RAGBadge';
import MeetingTimeline from '../components/meetings/MeetingTimeline';
import AddMeetingForm from '../components/meetings/AddMeetingForm';
import ActionsList from '../components/actions/ActionsList';
import AddActionForm from '../components/actions/AddActionForm';

const MEMBERSHIP_OPTIONS = [
  { value: 'Business Certification', label: 'Business Certification' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Net Zero Committed', label: 'Net Zero Committed' },
  { value: 'Multiple Tiers', label: 'Multiple Tiers' },
];

const REPORT_STATUS_OPTIONS = [
  { value: 'In progress', label: 'In progress' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Report Delivered', label: 'Report Delivered' },
  { value: 'Data Submitted', label: 'Data Submitted' },
];

const RAG_OPTIONS = [
  { value: 'Green', label: 'Green' },
  { value: 'Amber', label: 'Amber' },
  { value: 'Red', label: 'Red' },
];

const ADDON_OPTIONS = [
  { value: 'Social Value', label: 'Social Value' },
  { value: 'PPN', label: 'PPN' },
  { value: 'ESOS', label: 'ESOS' },
];

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((m) => ({ value: m, label: m }));

const PERIOD_OPTIONS = [
  'January - December', 'July - June', 'April - March',
  'October - September', 'November - October', 'December - November',
].map((p) => ({ value: p, label: p }));

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'meetings' | 'actions'>('meetings');
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [a, m, act] = await Promise.all([
      getAccount(id),
      getMeetingsForAccount(id),
      getActionsForAccount(id),
    ]);
    setAccount(a);
    setMeetings(m);
    setActions(act);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = async (field: string, value: unknown) => {
    if (!account) return;
    setAccount({ ...account, [field]: value } as Account);
    await updateAccount(account.id, { [field]: value } as Partial<Account>);
  };

  if (loading || !account) {
    return <div className="text-gray-400 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Link to="/accounts" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} />
        Back to accounts
      </Link>

      <div className="flex gap-8">
        {/* Left sidebar */}
        <div className="w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
            <div>
              <InlineEdit
                value={account.company_name}
                onSave={(v) => handleUpdate('company_name', v)}
                renderValue={(v) => <h2 className="text-lg font-semibold text-gray-900">{String(v)}</h2>}
              />
            </div>

            <Field label="Membership Level">
              <InlineEdit value={account.membership_level} variant="select" options={MEMBERSHIP_OPTIONS} onSave={(v) => handleUpdate('membership_level', v)} />
            </Field>

            <Field label="Add-Ons">
              <InlineEdit value={account.add_ons} variant="multiselect" options={ADDON_OPTIONS} onSave={(v) => handleUpdate('add_ons', v)} />
            </Field>

            <Field label="Report Status">
              <InlineEdit value={account.report_status} variant="select" options={REPORT_STATUS_OPTIONS} onSave={(v) => handleUpdate('report_status', v)} />
            </Field>

            <Field label="RAG Status">
              <InlineEdit
                value={account.rag_status}
                variant="select"
                options={RAG_OPTIONS}
                onSave={(v) => handleUpdate('rag_status', v)}
                renderValue={(v) => <RAGBadge status={v as Account['rag_status']} showLabel />}
              />
            </Field>

            <Field label="Main POC">
              <InlineEdit value={account.main_poc} onSave={(v) => handleUpdate('main_poc', v)} placeholder="Add contact..." />
            </Field>

            <Field label="Recurring Meetings">
              <InlineEdit value={account.recurring_meetings} variant="toggle" onSave={(v) => handleUpdate('recurring_meetings', v)} />
            </Field>

            <Field label="Reporting Period">
              <InlineEdit value={account.reporting_period} variant="select" options={PERIOD_OPTIONS} onSave={(v) => handleUpdate('reporting_period', v)} />
            </Field>

            <Field label="Renewal Month">
              <InlineEdit value={account.renewal_month} variant="select" options={MONTH_OPTIONS} onSave={(v) => handleUpdate('renewal_month', v)} />
            </Field>

            <Field label="Reporting Deadline">
              <InlineEdit value={account.reporting_deadline} variant="date" onSave={(v) => handleUpdate('reporting_deadline', v)} />
            </Field>

            <Field label="Current ARR">
              <InlineEdit value={account.current_arr} variant="number" prefix="£" onSave={(v) => handleUpdate('current_arr', v)} />
            </Field>

            <Field label="Opportunity Value">
              <InlineEdit value={account.opportunity_value} variant="number" prefix="£" onSave={(v) => handleUpdate('opportunity_value', v)} />
            </Field>

            <Field label="Open Opportunity">
              <InlineEdit value={account.open_opportunity} onSave={(v) => handleUpdate('open_opportunity', v)} />
            </Field>

            <Field label="Industry">
              <InlineEdit value={account.industry} onSave={(v) => handleUpdate('industry', v)} />
            </Field>

            <Field label="Turnover">
              <InlineEdit value={account.turnover} variant="textarea" onSave={(v) => handleUpdate('turnover', v)} />
            </Field>

            <Field label="Relevant Info">
              <InlineEdit value={account.relevant_info} variant="textarea" onSave={(v) => handleUpdate('relevant_info', v)} />
            </Field>

            <Field label="CRM ID">
              <InlineEdit value={account.crm_id} locked placeholder="Not linked" onSave={() => Promise.resolve()} />
            </Field>
          </div>
        </div>

        {/* Right main area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'meetings'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Meetings ({meetings.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'actions'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Actions ({actions.length})
            </button>
          </div>

          {activeTab === 'meetings' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddMeeting(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
                >
                  <Plus size={14} />
                  Add Meeting
                </button>
              </div>

              {showAddMeeting && (
                <AddMeetingForm
                  accountId={account.id}
                  onSaved={() => {
                    setShowAddMeeting(false);
                    loadData();
                  }}
                  onCancel={() => setShowAddMeeting(false)}
                />
              )}

              <MeetingTimeline meetings={meetings} onRefresh={loadData} />
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddAction(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
                >
                  <Plus size={14} />
                  Add Action
                </button>
              </div>

              {showAddAction && (
                <AddActionForm
                  accountId={account.id}
                  onSaved={() => {
                    setShowAddAction(false);
                    loadData();
                  }}
                  onCancel={() => setShowAddAction(false)}
                />
              )}

              <ActionsList actions={actions} onRefresh={loadData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</label>
      {children}
    </div>
  );
}
