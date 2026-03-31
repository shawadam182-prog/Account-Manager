import { useState } from 'react';
import { Sparkles, AlertTriangle, TrendingUp, ArrowRight, RefreshCw, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAI } from '../../services/aiService';
import type { Account, Meeting, Action } from '../../lib/types';

interface AccountSummaryData {
  overallStatus: string;
  keyHighlights: string[];
  risks: string[];
  opportunities: string[];
  relationshipHealth: 'Strong' | 'Good' | 'Needs Attention' | 'At Risk';
  nextSteps: string[];
  engagementTrend: 'Increasing' | 'Stable' | 'Declining' | 'New';
  lastContactSummary: string;
}

const HEALTH_CONFIG = {
  'Strong': { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
  'Good': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Needs Attention': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  'At Risk': { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
};

const TREND_CONFIG = {
  'Increasing': { color: 'text-green-600', label: 'Increasing' },
  'Stable': { color: 'text-zinc-600', label: 'Stable' },
  'Declining': { color: 'text-red-600', label: 'Declining' },
  'New': { color: 'text-blue-600', label: 'New Account' },
};

export default function AccountSummary({ account, meetings, actions }: {
  account: Account;
  meetings: Meeting[];
  actions: Action[];
}) {
  const [summary, setSummary] = useState<AccountSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const accountDetails = [
        `Membership: ${account.membership_level || 'Not set'}`,
        `RAG Status: ${account.rag_status || 'Not set'}`,
        `Report Status: ${account.report_status || 'Not set'}`,
        `Main POC: ${account.main_poc || 'Not set'}`,
        `Renewal Month: ${account.renewal_month || 'Not set'}`,
        `Reporting Period: ${account.reporting_period || 'Not set'}`,
        `Current ARR: ${account.current_arr ? `£${account.current_arr.toLocaleString()}` : 'Not set'}`,
        `Add-Ons: ${account.add_ons?.join(', ') || 'None'}`,
        `Industry: ${account.industry || 'Not set'}`,
        `Recurring Meetings: ${account.recurring_meetings ? 'Yes' : 'No'}`,
        account.relevant_info ? `Relevant Info: ${account.relevant_info}` : '',
      ].filter(Boolean).join('\n');

      const meetingsSummary = meetings
        .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
        .map((m) => {
          const notes = m.notes?.slice(0, 500) || 'No notes';
          const type = m.meeting_type || 'Unknown type';
          const attendees = m.attendees || 'Unknown';
          return `[${m.meeting_date}] ${type} (Attendees: ${attendees})\n${notes}`;
        })
        .join('\n\n---\n\n');

      const openActions = actions
        .filter((a) => a.status === 'Open')
        .map((a) => `- ${a.description} (Owner: ${a.owner}${a.due_date ? `, Due: ${a.due_date}` : ''})`)
        .join('\n');

      // Reuse the existing processTranscript action — format the account
      // history as a "transcript" so no edge function redeployment is needed
      const transcript = `=== ACCOUNT SUMMARY REQUEST ===
This is NOT a meeting transcript. Instead, generate a JSON account summary briefing.

Account details:
${accountDetails}

Open actions:
${openActions || "No open actions."}

Full meeting history (chronological):
${meetingsSummary.slice(0, 10000) || "No meetings recorded yet."}

=== IMPORTANT: OVERRIDE OUTPUT FORMAT ===
Ignore the normal transcript processing format. Instead respond with ONLY this JSON:
{
  "overallStatus": "2-3 sentence executive summary of where this account stands — health, relationship quality, trajectory",
  "keyHighlights": ["3-5 most important things to know right now"],
  "risks": ["active risks or red flags — empty array if none"],
  "opportunities": ["upsell/expansion signals — empty array if none"],
  "relationshipHealth": "Strong" | "Good" | "Needs Attention" | "At Risk",
  "nextSteps": ["top 3-5 priority actions based on full history"],
  "engagementTrend": "Increasing" | "Stable" | "Declining" | "New",
  "lastContactSummary": "one sentence about the most recent interaction"
}
Base everything on actual data. Be direct and actionable, not generic.`;

      const data = await callAI('processTranscript', {
        transcript,
        accountName: account.company_name,
        accountContext: '',
      });

      if (data.error) {
        setError('Failed to generate summary. Please try again.');
      } else {
        // The response may have our summary fields directly, or mixed with
        // processTranscript fields — extract what we need
        setSummary({
          overallStatus: data.overallStatus || data.summary || '',
          keyHighlights: data.keyHighlights || data.keyPoints || [],
          risks: data.risks || [],
          opportunities: data.opportunities || [],
          relationshipHealth: data.relationshipHealth || 'Good',
          nextSteps: data.nextSteps || (data.actions || []).map((a: { description: string }) => a.description),
          engagementTrend: data.engagementTrend || 'Stable',
          lastContactSummary: data.lastContactSummary || '',
        });
      }
    } catch {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!summary && !loading) {
    return (
      <button
        onClick={generateSummary}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-2xl text-sm font-semibold border-none cursor-pointer transition-all shadow-sm hover:shadow-md"
      >
        <Sparkles size={16} />
        Generate AI Account Summary
      </button>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-purple-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Sparkles size={16} className="text-purple-600 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-700 m-0">Analysing account history...</p>
            <p className="text-xs text-zinc-400 m-0 mt-0.5">
              Reviewing {meetings.length} meetings and {actions.filter(a => a.status === 'Open').length} open actions
            </p>
          </div>
        </div>
        <div className="mt-4 h-1.5 bg-purple-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <p className="text-sm text-red-700 m-0">{error}</p>
        <button
          onClick={generateSummary}
          className="mt-3 text-sm font-semibold text-red-600 hover:text-red-800 bg-transparent border-none cursor-pointer p-0 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const health = HEALTH_CONFIG[summary.relationshipHealth] || HEALTH_CONFIG['Good'];
  const trend = TREND_CONFIG[summary.engagementTrend] || TREND_CONFIG['Stable'];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm border border-purple-200/60 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-purple-50/80 to-violet-50/80 border-b border-purple-100/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <h3 className="text-sm font-bold text-zinc-800 m-0">AI Account Summary</h3>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${health.bg} ${health.color} ${health.border} border`}>
            <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
            {summary.relationshipHealth}
          </span>
          <span className={`text-[11px] font-semibold ${trend.color} flex items-center gap-1`}>
            <Activity size={11} />
            {trend.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateSummary}
            className="p-1.5 text-zinc-400 hover:text-purple-600 bg-transparent border-none cursor-pointer rounded-lg hover:bg-purple-50 transition-colors"
            title="Refresh summary"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 bg-transparent border-none cursor-pointer rounded-lg hover:bg-zinc-100 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-5 space-y-5">
              {/* Overall Status */}
              <div>
                <p className="text-sm text-zinc-700 leading-relaxed m-0">
                  {summary.overallStatus}
                </p>
                {summary.lastContactSummary && (
                  <p className="text-xs text-zinc-400 mt-2 m-0 italic">
                    Last contact: {summary.lastContactSummary}
                  </p>
                )}
              </div>

              {/* Key Highlights */}
              {summary.keyHighlights.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest m-0 mb-2">Key Highlights</h4>
                  <ul className="m-0 pl-0 list-none space-y-1.5">
                    {summary.keyHighlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks & Opportunities side by side */}
              {(summary.risks.length > 0 || summary.opportunities.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  {summary.risks.length > 0 && (
                    <div className="bg-red-50/60 rounded-xl p-3.5 border border-red-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle size={12} className="text-red-500" />
                        <h4 className="text-[11px] font-bold text-red-600 uppercase tracking-widest m-0">Risks</h4>
                      </div>
                      <ul className="m-0 pl-0 list-none space-y-1">
                        {summary.risks.map((r, i) => (
                          <li key={i} className="text-xs text-red-700 leading-relaxed">{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summary.opportunities.length > 0 && (
                    <div className="bg-green-50/60 rounded-xl p-3.5 border border-green-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingUp size={12} className="text-green-600" />
                        <h4 className="text-[11px] font-bold text-green-700 uppercase tracking-widest m-0">Opportunities</h4>
                      </div>
                      <ul className="m-0 pl-0 list-none space-y-1">
                        {summary.opportunities.map((o, i) => (
                          <li key={i} className="text-xs text-green-700 leading-relaxed">{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Next Steps */}
              {summary.nextSteps.length > 0 && (
                <div className="bg-zinc-50/80 rounded-xl p-4 border border-zinc-100">
                  <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest m-0 mb-2.5 flex items-center gap-1.5">
                    <ArrowRight size={12} />
                    Recommended Next Steps
                  </h4>
                  <ol className="m-0 pl-0 list-none space-y-2 counter-reset-steps">
                    {summary.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700">
                        <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
