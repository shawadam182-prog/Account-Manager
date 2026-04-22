import { useState, useRef, useEffect } from 'react';
import { Sparkles, RefreshCw, Pencil, Check, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { callAI } from '../../services/aiService';
import { getContactAttemptsForAccount } from '../../services/contactAttemptsService';
import type { Account, Meeting, Action } from '../../lib/types';

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EditableAccountSummary({
  account,
  meetings,
  actions,
  onSave,
}: {
  account: Account;
  meetings: Meeting[];
  actions: Action[];
  onSave: (summary: string | null, updatedAt: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(account.account_summary || '');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(account.account_summary || '');
  }, [account.account_summary]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const trimmed = draft.trim();
      await onSave(trimmed || null, trimmed ? new Date().toISOString() : null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(account.account_summary || '');
    setEditing(false);
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const attempts = await getContactAttemptsForAccount(account.id);

      const accountDetails = [
        `Company: ${account.company_name}`,
        `Membership Level: ${account.membership_level || 'Not set'}`,
        `Add-Ons: ${account.add_ons?.join(', ') || 'None'}`,
        `RAG Status: ${account.rag_status || 'Not set'}`,
        `Report Status: ${account.report_status || 'Not set'}`,
        `Main POC: ${account.main_poc || 'Not set'}`,
        `Renewal Month: ${account.renewal_month || 'Not set'}`,
        `Reporting Period: ${account.reporting_period || 'Not set'}`,
        `Reporting Deadline: ${account.reporting_deadline || 'Not set'}`,
        `Current ARR: ${account.current_arr ? `£${account.current_arr.toLocaleString()}` : 'Not set'}`,
        `Opportunity Value: ${account.opportunity_value ? `£${account.opportunity_value.toLocaleString()}` : 'Not set'}`,
        account.has_open_opportunity ? `Open Opportunity: Yes${account.open_opportunity ? ` (${account.open_opportunity})` : ''}` : 'Open Opportunity: No',
        `Industry: ${account.industry || 'Not set'}`,
        `Recurring Meetings: ${account.recurring_meetings ? 'Yes' : 'No'}`,
        account.turnover ? `Turnover: ${account.turnover}` : '',
        account.relevant_info ? `Relevant Info: ${account.relevant_info}` : '',
      ].filter(Boolean).join('\n');

      const meetingHistory = meetings
        .slice()
        .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
        .map((m) => {
          const notes = m.notes?.trim() || '(no notes recorded)';
          return `[${m.meeting_date}] ${m.meeting_type}${m.attendees ? ` · Attendees: ${m.attendees}` : ''}\n${notes}`;
        })
        .join('\n\n---\n\n') || '(no meetings recorded)';

      const openActions = actions
        .filter((a) => a.status === 'Open')
        .map((a) => `- ${a.description} [owner: ${a.owner}${a.due_date ? `, due ${a.due_date}` : ''}${a.action_type ? `, ${a.action_type}` : ''}]`)
        .join('\n') || '(none)';

      const recentDoneActions = actions
        .filter((a) => a.status === 'Done')
        .slice(0, 10)
        .map((a) => `- ${a.description} [owner: ${a.owner}]`)
        .join('\n') || '(none)';

      const contactAttemptsStr = attempts.length > 0
        ? attempts.slice(0, 15).map((c) => `- ${c.attempt_date} · ${c.method}${c.outcome ? ` → ${c.outcome}` : ''}${c.notes ? ` (${c.notes})` : ''}`).join('\n')
        : '(none recorded)';

      const transcript = `=== ACCOUNT SUMMARY GENERATION ===

You are writing a concise, accurate, prose account briefing for Millie (Account Manager at Planet Mark, a UK sustainability certification company). Base every statement on the data below. Do not invent details. If data is sparse, say so honestly rather than padding.

ACCOUNT DETAILS
${accountDetails}

FULL MEETING HISTORY (chronological, oldest first)
${meetingHistory.slice(0, 18000)}

OPEN ACTIONS
${openActions}

RECENT COMPLETED ACTIONS
${recentDoneActions}

CONTACT ATTEMPTS (most recent first)
${contactAttemptsStr}

=== OUTPUT INSTRUCTIONS (STRICT) ===
Respond with ONLY this JSON, no prose outside the JSON, no markdown:
{
  "summary": "A clean prose briefing, 2-4 short paragraphs (total 150-280 words). Write in British English. Be specific — reference actual meeting content, dates, and facts from the data. Cover: (1) current relationship health and trajectory, (2) what's been happening lately and what matters now, (3) key risks or concerns to watch, (4) opportunities or next priorities. Do not use bullet points or lists inside the summary. Do not repeat the company name in every paragraph. Write for someone who already knows the account basics — focus on what's notable, what's changed, and what needs attention."
}`;

      const data = await callAI('processTranscript', {
        transcript,
        accountName: account.company_name,
        accountContext: '',
      });

      if (data.error) {
        setError(`AI error: ${data.error}`);
        return;
      }

      const generated = String(data.summary || data.suggestedNotes || '').trim();
      if (!generated) {
        setError('AI returned an empty summary. Try again.');
        return;
      }

      const now = new Date().toISOString();
      setDraft(generated);
      await onSave(generated, now);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setGenerating(false);
    }
  };

  const hasSummary = !!(account.account_summary && account.account_summary.trim());
  const updatedLabel = timeAgo(account.summary_updated_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <h3 className="text-sm font-bold text-zinc-800 m-0">Account Summary</h3>
          {updatedLabel && (
            <span className="text-[11px] font-medium text-zinc-400">Updated {updatedLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!editing && hasSummary && (
            <button
              onClick={() => setEditing(true)}
              title="Edit summary"
              className="p-1.5 text-zinc-400 hover:text-zinc-700 bg-transparent border-none cursor-pointer rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <Pencil size={13} />
            </button>
          )}
          <button
            onClick={generate}
            disabled={generating}
            title="Regenerate with AI"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {generating ? 'Generating...' : hasSummary ? 'Refresh with AI' : 'Generate with AI'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {editing ? (
          <div className="flex flex-col gap-3">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                }
              }}
              rows={6}
              placeholder="Write a summary of this account..."
              className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm text-zinc-700 leading-relaxed outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
              style={{ minHeight: '140px' }}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary-hover border-none rounded-lg cursor-pointer transition-colors disabled:opacity-50"
              >
                <Check size={12} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-500 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        ) : hasSummary ? (
          <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {account.account_summary}
          </div>
        ) : (
          <div className="text-sm text-zinc-400 italic py-2">
            No summary yet. Click <b>Generate with AI</b> to build one from meetings, actions and contact history, or{' '}
            <button
              onClick={() => setEditing(true)}
              className="text-brand-primary hover:text-brand-primary-hover bg-transparent border-none p-0 cursor-pointer underline font-semibold"
            >
              write one manually
            </button>.
          </div>
        )}
      </div>
    </motion.div>
  );
}
