import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { addAccount, getAccounts } from '../../services/accountsService';
import type { MembershipLevel } from '../../lib/types';

const MEMBERSHIP_OPTIONS: MembershipLevel[] = [
  'Business Certification',
  'Advanced',
  'Net Zero Committed',
  'Multiple Tiers',
  'Achiever',
];

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PERIOD_OPTIONS = [
  'January - December', 'July - June', 'April - March',
  'October - September', 'November - October', 'December - November',
];

export default function AddAccountForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [companyName, setCompanyName] = useState('');
  const [membership, setMembership] = useState<MembershipLevel | ''>('');
  const [mainPoc, setMainPoc] = useState('');
  const [renewalMonth, setRenewalMonth] = useState('');
  const [reportingPeriod, setReportingPeriod] = useState('');
  const [industry, setIndustry] = useState('');
  const [parentAccountId, setParentAccountId] = useState<string | null>(null);
  const [parentOptions, setParentOptions] = useState<{ id: string; name: string }[]>([]);
  const [showExtra, setShowExtra] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAccounts().then((data) =>
      setParentOptions(data.map((a) => ({ id: a.id, name: a.company_name })))
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setSaving(true);
    try {
      await addAccount({
        company_name: companyName.trim(),
        membership_level: membership || null,
        main_poc: mainPoc.trim() || null,
        renewal_month: renewalMonth || null,
        reporting_period: reportingPeriod || null,
        industry: industry.trim() || null,
        parent_account_id: parentAccountId,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/80 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Plus size={14} className="text-brand-primary" />
          <span className="text-sm font-bold text-zinc-700">New Account</span>
        </div>
        <button type="button" onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 bg-transparent border-none cursor-pointer p-0.5">
          <X size={14} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Company name */}
        <input
          type="text"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          placeholder="Company name"
          required
          autoFocus
          className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all bg-white placeholder:text-zinc-400"
        />

        {/* Main row */}
        <div className="flex items-end gap-2.5 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Membership</label>
            <select value={membership} onChange={e => setMembership(e.target.value as MembershipLevel)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all">
              <option value="">None</option>
              {MEMBERSHIP_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Main POC</label>
            <input
              type="text"
              value={mainPoc}
              onChange={e => setMainPoc(e.target.value)}
              placeholder="Contact name"
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all w-40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Renewal Month</label>
            <select value={renewalMonth} onChange={e => setRenewalMonth(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all">
              <option value="">None</option>
              {MONTH_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Toggle extra fields */}
        {!showExtra && (
          <button
            type="button"
            onClick={() => setShowExtra(true)}
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover bg-transparent border-none cursor-pointer p-0 self-start"
          >
            + More details
          </button>
        )}

        {showExtra && (
          <div className="flex items-end gap-2.5 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Reporting Period</label>
              <select value={reportingPeriod} onChange={e => setReportingPeriod(e.target.value)}
                className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all">
                <option value="">None</option>
                {PERIOD_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                placeholder="e.g. Construction"
                className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all w-40"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Parent Account</label>
              <select
                value={parentAccountId ?? ''}
                onChange={e => setParentAccountId(e.target.value || null)}
                className="px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-primary/20 transition-all max-w-xs"
              >
                <option value="">None</option>
                {parentOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Submit row */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-zinc-500 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover border-none rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : 'Create Account'}
          </button>
        </div>
      </div>
    </form>
  );
}
