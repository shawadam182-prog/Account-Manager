import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
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
  const [showTranscriptUpload, setShowTranscriptUpload] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

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
      <div style={{ color: '#9CA3AF', paddingTop: '48px', paddingBottom: '48px', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  const getTabStyle = (tab: 'meetings' | 'actions'): React.CSSProperties => {
    const isActive = activeTab === tab;
    const isHovered = hoveredTab === tab;
    return {
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: 500,
      borderBottom: `2px solid ${isActive ? '#16a34a' : 'transparent'}`,
      marginBottom: '-1px',
      transition: 'color 0.15s, border-color 0.15s',
      color: isActive ? '#16a34a' : (isHovered ? '#374151' : '#9CA3AF'),
      background: 'none',
      border: 'none',
      borderBottomStyle: 'solid',
      borderBottomWidth: '2px',
      borderBottomColor: isActive ? '#16a34a' : 'transparent',
      cursor: 'pointer',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Link
        to="/accounts"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '14px',
          color: '#9CA3AF',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#374151'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
      >
        <ArrowLeft size={14} />
        Back to accounts
      </Link>

      <div className="detail-layout">
        {/* Left sidebar */}
        <div className="detail-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #E8E3DB',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div>
              <InlineEdit
                value={account.company_name}
                onSave={(v) => handleUpdate('company_name', v)}
                renderValue={(v) => (
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                    {String(v)}
                  </h2>
                )}
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderBottom: '1px solid #E8E3DB',
            marginBottom: '16px',
          }}>
            <button
              onClick={() => setActiveTab('meetings')}
              onMouseEnter={() => setHoveredTab('meetings')}
              onMouseLeave={() => setHoveredTab(null)}
              style={getTabStyle('meetings')}
            >
              Meetings ({meetings.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              onMouseEnter={() => setHoveredTab('actions')}
              onMouseLeave={() => setHoveredTab(null)}
              style={getTabStyle('actions')}
            >
              Actions ({actions.length})
            </button>
          </div>

          {activeTab === 'meetings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => { setShowTranscriptUpload(true); setShowAddMeeting(false); }}
                  onMouseEnter={() => setHoveredBtn('transcript')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    border: '1px solid #86EFAC',
                    color: '#15803D',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: hoveredBtn === 'transcript' ? '#F0FDF4' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <Sparkles size={14} />
                  Upload Transcript
                </button>
                <button
                  onClick={() => { setShowAddMeeting(true); setShowTranscriptUpload(false); }}
                  onMouseEnter={() => setHoveredBtn('addMeeting')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: hoveredBtn === 'addMeeting' ? '#15803D' : '#16a34a',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddAction(true)}
                  onMouseEnter={() => setHoveredBtn('addAction')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: hoveredBtn === 'addAction' ? '#15803D' : '#16a34a',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
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
      <label style={{
        display: 'block',
        fontSize: '12px',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '2px',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}
