import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles, Building2, FileText, Users, Calendar, DollarSign, Info } from 'lucide-react';
import { motion } from 'framer-motion';
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
import TranscriptUpload from '../components/meetings/TranscriptUpload';
import AccountSummary from '../components/accounts/AccountSummary';

const MEMBERSHIP_OPTIONS = [
  { value: 'Business Certification', label: 'Business Certification' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Net Zero Committed', label: 'Net Zero Committed' },
  { value: 'Multiple Tiers', label: 'Multiple Tiers' },
  { value: 'Achiever', label: 'Achiever' },
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
  { value: 'Data Management', label: 'Data Management' },
];

const HEALTH_OVERRIDE_OPTIONS = [
  { value: '', label: 'Auto (computed)' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'risk', label: 'At Risk' },
  { value: 'critical', label: 'Critical' },
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
  const [showTranscriptUpload, setShowTranscriptUpload] = useState(false);

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

  useEffect(() => {
    if (account) {
      document.title = `${account.company_name} — Planet Mark AM`;
    }
  }, [account]);

  const handleUpdate = async (field: string, value: unknown) => {
    if (!account) return;
    setAccount({ ...account, [field]: value } as Account);
    await updateAccount(account.id, { [field]: value } as Partial<Account>);
  };

  if (loading || !account) {
    return (
      <div className="text-zinc-400 py-12 text-center">Loading...</div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      <Link
        to="/accounts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to accounts
      </Link>

      <div className="detail-layout">
        {/* Left sidebar */}
        <div className="detail-sidebar flex flex-col gap-5">
          {/* Header card */}
          <div className="bg-white/80 backdrop-blur-sm border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
            <InlineEdit
              value={account.company_name}
              onSave={(v) => handleUpdate('company_name', v)}
              renderValue={(v) => (
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 m-0">
                  {String(v)}
                </h2>
              )}
            />
            <div className="mt-4 flex items-center gap-3">
              <InlineEdit
                value={account.rag_status}
                variant="select"
                options={RAG_OPTIONS}
                onSave={(v) => handleUpdate('rag_status', v)}
                renderValue={(v) => <RAGBadge status={v as Account['rag_status']} showLabel />}
              />
              <span className="text-zinc-300">|</span>
              <InlineEdit
                value={account.report_status}
                variant="select"
                options={REPORT_STATUS_OPTIONS}
                onSave={(v) => handleUpdate('report_status', v)}
                renderValue={(v) => (
                  <span className={`text-sm font-semibold ${
                    v === 'Overdue' ? 'text-red-600' :
                    v === 'Report Delivered' ? 'text-green-600' :
                    v === 'Data Submitted' ? 'text-blue-600' :
                    v === 'In progress' ? 'text-amber-600' :
                    'text-zinc-400 italic'
                  }`}>
                    {v ? String(v) : 'No report status'}
                  </span>
                )}
              />
            </div>
          </div>

          {/* Membership & Services */}
          <SidebarSection icon={<Building2 size={14} />} title="Membership & Services">
            <Field label="Membership Level">
              <InlineEdit value={account.membership_level} variant="select" options={MEMBERSHIP_OPTIONS} onSave={(v) => handleUpdate('membership_level', v)} />
            </Field>
            <Field label="Add-Ons">
              <InlineEdit value={account.add_ons} variant="multiselect" options={ADDON_OPTIONS} onSave={(v) => handleUpdate('add_ons', v)} />
            </Field>
            <Field label="Health Override">
              <InlineEdit
                value={account.health_override || ''}
                variant="select"
                options={HEALTH_OVERRIDE_OPTIONS}
                onSave={(v) => handleUpdate('health_override', v || null)}
              />
            </Field>
          </SidebarSection>

          {/* Contact */}
          <SidebarSection icon={<Users size={14} />} title="Contact">
            <Field label="Main POC">
              <InlineEdit value={account.main_poc} onSave={(v) => handleUpdate('main_poc', v)} placeholder="Add contact..." />
            </Field>
            <Field label="Recurring Meetings">
              <InlineEdit value={account.recurring_meetings} variant="toggle" onSave={(v) => handleUpdate('recurring_meetings', v)} />
            </Field>
          </SidebarSection>

          {/* Reporting */}
          <SidebarSection icon={<FileText size={14} />} title="Reporting">
            <Field label="Reporting Period">
              <InlineEdit value={account.reporting_period} variant="select" options={PERIOD_OPTIONS} onSave={(v) => handleUpdate('reporting_period', v)} />
            </Field>
            <Field label="Reporting Deadline">
              <InlineEdit value={account.reporting_deadline} variant="date" onSave={(v) => handleUpdate('reporting_deadline', v)} />
            </Field>
          </SidebarSection>

          {/* Dates & Renewal */}
          <SidebarSection icon={<Calendar size={14} />} title="Renewal">
            <Field label="Renewal Month">
              <InlineEdit value={account.renewal_month} variant="select" options={MONTH_OPTIONS} onSave={(v) => handleUpdate('renewal_month', v)} />
            </Field>
          </SidebarSection>

          {/* Financials */}
          <SidebarSection icon={<DollarSign size={14} />} title="Financials">
            <Field label="Current ARR">
              <InlineEdit value={account.current_arr} variant="number" prefix="£" onSave={(v) => handleUpdate('current_arr', v)} />
            </Field>
            <Field label="Opportunity Value">
              <InlineEdit value={account.opportunity_value} variant="number" prefix="£" onSave={(v) => handleUpdate('opportunity_value', v)} />
            </Field>
            <Field label="Open Opportunity">
              <InlineEdit value={account.open_opportunity} onSave={(v) => handleUpdate('open_opportunity', v)} />
            </Field>
          </SidebarSection>

          {/* Additional Info */}
          <SidebarSection icon={<Info size={14} />} title="Additional Info">
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
          </SidebarSection>
        </div>

        {/* Right main area */}
        <div className="min-w-0 flex flex-col gap-6">
          {/* AI Summary */}
          <AccountSummary
            account={account}
            meetings={meetings}
            actions={actions}
            onSave={async (summary) => {
              await handleUpdate('ai_summary', summary);
            }}
          />

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-zinc-200/80 mb-6">
            <TabButton
              active={activeTab === 'meetings'}
              onClick={() => setActiveTab('meetings')}
              label={`Meetings (${meetings.length})`}
            />
            <TabButton
              active={activeTab === 'actions'}
              onClick={() => setActiveTab('actions')}
              label={`Actions (${actions.length})`}
            />
          </div>

          {activeTab === 'meetings' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowTranscriptUpload(true); setShowAddMeeting(false); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-green-300 text-green-700 rounded-xl text-sm font-semibold bg-transparent hover:bg-green-50 cursor-pointer transition-colors"
                >
                  <Sparkles size={14} />
                  Upload Transcript
                </button>
                <button
                  onClick={() => { setShowAddMeeting(true); setShowTranscriptUpload(false); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  Add Meeting
                </button>
              </div>

              {showTranscriptUpload && (
                <TranscriptUpload
                  accountId={account.id}
                  accountName={account.company_name}
                  accountContext={meetings
                    .slice(0, 3)
                    .map((m) => `${m.meeting_date}: ${m.notes?.slice(0, 200) || 'No notes'}`)
                    .join('\n\n')}
                  onSaved={() => { setShowTranscriptUpload(false); loadData(); }}
                  onCancel={() => setShowTranscriptUpload(false)}
                />
              )}

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

              <MeetingTimeline meetings={meetings} accountName={account.company_name} onRefresh={loadData} />
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddAction(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors"
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
    </motion.div>
  );
}

function SidebarSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 bg-zinc-50/50">
        <span className="text-zinc-400">{icon}</span>
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest m-0">{title}</h3>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-x-0 border-t-0 ${
        active
          ? 'border-b-brand-primary text-brand-primary'
          : 'border-b-transparent text-zinc-400 hover:text-zinc-700'
      }`}
    >
      {label}
    </button>
  );
}
