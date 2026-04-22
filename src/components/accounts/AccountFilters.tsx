import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';

const RAG_OPTIONS = ['Green', 'Amber', 'Red', 'Not set'];
const REPORT_OPTIONS = ['In progress', 'Overdue', 'Report Delivered', 'Data Submitted', 'Not set'];
const MEMBERSHIP_OPTIONS = ['Business Certification', 'Advanced', 'Net Zero Committed', 'Multiple Tiers', 'Achiever'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ADDON_OPTIONS = ['Social Value', 'PPN', 'ESOS', 'Data Management'];

function MultiSelect({ label, param, options }: { label: string; param: string; options: string[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = searchParams.get(param)?.split(',').filter(Boolean) || [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (val: string) => {
    const next = selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val];
    const params = new URLSearchParams(searchParams);
    if (next.length === 0) {
      params.delete(param);
    } else {
      params.set(param, next.join(','));
    }
    setSearchParams(params);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${selected.length > 0 ? 'border-green-300 bg-green-50 text-green-700' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'}`}
      >
        {label} {selected.length > 0 && `(${selected.length})`}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-xl shadow-lg z-50 min-w-[180px] p-1">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-zinc-700 cursor-pointer rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="w-3.5 h-3.5 text-brand-primary rounded border-zinc-300 focus:ring-brand-primary cursor-pointer"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold tracking-wide uppercase">
      {label}
      <button
        onClick={onRemove}
        className="bg-transparent border-none cursor-pointer text-green-700 p-0 hover:text-green-900 transition-colors leading-none"
      >×</button>
    </span>
  );
}

export default function AccountFilters({ totalCount, filteredCount }: { totalCount: number; filteredCount: number }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const ragFilter = searchParams.get('rag')?.split(',').filter(Boolean) || [];
  const reportFilter = searchParams.get('report')?.split(',').filter(Boolean) || [];
  const membershipFilter = searchParams.get('membership')?.split(',').filter(Boolean) || [];
  const renewalFilter = searchParams.get('renewal')?.split(',').filter(Boolean) || [];
  const addonsFilter = searchParams.get('addons')?.split(',').filter(Boolean) || [];
  const openOppsActive = searchParams.get('opps') === '1';

  const hasFilters = Array.from(searchParams.keys()).length > 0;

  const toggleOpenOpps = () => {
    const params = new URLSearchParams(searchParams);
    if (openOppsActive) params.delete('opps');
    else params.set('opps', '1');
    setSearchParams(params);
  };

  const removeFromParam = (param: string, val: string) => {
    const current = searchParams.get(param)?.split(',').filter(Boolean) || [];
    const next = current.filter((v) => v !== val);
    const params = new URLSearchParams(searchParams);
    if (next.length === 0) params.delete(param); else params.set(param, next.join(','));
    setSearchParams(params);
  };

  return (
    <div className="relative z-30 bg-white/70 backdrop-blur-md border border-zinc-200/80 rounded-2xl p-5 shadow-sm mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search company or contact..."
          value={search}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams);
            if (e.target.value) {
              params.set('search', e.target.value);
            } else {
              params.delete('search');
            }
            setSearchParams(params);
          }}
          className="px-4 py-2 outline-none border border-zinc-200/80 bg-white rounded-xl text-sm font-medium text-zinc-900 w-64 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-300"
        />
        <MultiSelect label="RAG Status" param="rag" options={RAG_OPTIONS} />
        <MultiSelect label="Report Status" param="report" options={REPORT_OPTIONS} />
        <MultiSelect label="Membership" param="membership" options={MEMBERSHIP_OPTIONS} />
        <MultiSelect label="Renewal Month" param="renewal" options={MONTHS} />
        <MultiSelect label="Add-Ons" param="addons" options={ADDON_OPTIONS} />
        <button
          onClick={toggleOpenOpps}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${openOppsActive ? 'border-green-300 bg-green-50 text-green-700' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'}`}
        >
          Open Opps
        </button>
        {hasFilters && (
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={14} strokeWidth={3} /> Clear all
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-4">
          {search && (
            <ActiveChip label={`Search: "${search}"`} onRemove={() => {
              const p = new URLSearchParams(searchParams); p.delete('search'); setSearchParams(p);
            }} />
          )}
          {ragFilter.map((v) => (
            <ActiveChip key={v} label={`RAG: ${v}`} onRemove={() => removeFromParam('rag', v)} />
          ))}
          {reportFilter.map((v) => (
            <ActiveChip key={v} label={`Report: ${v}`} onRemove={() => removeFromParam('report', v)} />
          ))}
          {membershipFilter.map((v) => (
            <ActiveChip key={v} label={v} onRemove={() => removeFromParam('membership', v)} />
          ))}
          {renewalFilter.map((v) => (
            <ActiveChip key={v} label={`Renewal: ${v}`} onRemove={() => removeFromParam('renewal', v)} />
          ))}
          {addonsFilter.map((v) => (
            <ActiveChip key={v} label={v} onRemove={() => removeFromParam('addons', v)} />
          ))}
          {openOppsActive && (
            <ActiveChip label="Open Opps" onRemove={toggleOpenOpps} />
          )}
        </div>
      )}

      <p className="text-xs font-semibold text-zinc-500 mt-4 uppercase tracking-widest">
        {filteredCount === totalCount
          ? `${totalCount} accounts`
          : `${filteredCount} of ${totalCount} accounts`}
      </p>
    </div>
  );
}
