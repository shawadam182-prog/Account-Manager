import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';

const RAG_OPTIONS = ['Green', 'Amber', 'Red', 'Not set'];
const REPORT_OPTIONS = ['In progress', 'Overdue', 'Report Delivered', 'Data Submitted', 'Not set'];
const MEMBERSHIP_OPTIONS = ['Business Certification', 'Advanced', 'Net Zero Committed', 'Multiple Tiers'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ADDON_OPTIONS = ['Social Value', 'PPN', 'ESOS'];

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
        className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${selected.length > 0 ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}
      >
        {label} {selected.length > 0 && `(${selected.length})`}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px]">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded text-emerald-500 focus:ring-emerald-500"
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs">
      {label}
      <button onClick={onRemove} className="hover:text-emerald-900">×</button>
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

  const hasFilters = Array.from(searchParams.keys()).length > 0;

  const removeFromParam = (param: string, val: string) => {
    const current = searchParams.get(param)?.split(',').filter(Boolean) || [];
    const next = current.filter((v) => v !== val);
    const params = new URLSearchParams(searchParams);
    if (next.length === 0) params.delete(param); else params.set(param, next.join(','));
    setSearchParams(params);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search company or POC..."
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
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg w-64 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
        <MultiSelect label="RAG Status" param="rag" options={RAG_OPTIONS} />
        <MultiSelect label="Report Status" param="report" options={REPORT_OPTIONS} />
        <MultiSelect label="Membership" param="membership" options={MEMBERSHIP_OPTIONS} />
        <MultiSelect label="Renewal Month" param="renewal" options={MONTHS} />
        <MultiSelect label="Add-Ons" param="addons" options={ADDON_OPTIONS} />
        {hasFilters && (
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5">
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
        </div>
      )}
      <p className="text-xs text-gray-500">
        {filteredCount === totalCount
          ? `${totalCount} accounts`
          : `${filteredCount} of ${totalCount} accounts`}
      </p>
    </div>
  );
}
