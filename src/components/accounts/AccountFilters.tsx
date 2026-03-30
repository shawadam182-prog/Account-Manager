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
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '5px 10px', fontSize: '12px', borderRadius: '6px',
          border: selected.length > 0 ? '1px solid #86EFAC' : '1px solid #E5E0D8',
          background: selected.length > 0 ? '#F0FDF4' : '#FDFCF9',
          color: selected.length > 0 ? '#15803D' : '#6B7280',
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
        }}
      >
        {label} {selected.length > 0 && `(${selected.length})`}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '4px',
          background: 'white', border: '1px solid #E8E3DB',
          borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 20, minWidth: '180px', padding: '4px',
        }}>
          {options.map((opt) => (
            <label
              key={opt}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 10px', fontSize: '13px', cursor: 'pointer',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
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
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '20px',
      background: '#F0FDF4', border: '1px solid #86EFAC',
      color: '#15803D', fontSize: '12px', fontWeight: 500,
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803D', padding: 0, lineHeight: 1 }}
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

  const hasFilters = Array.from(searchParams.keys()).length > 0;

  const removeFromParam = (param: string, val: string) => {
    const current = searchParams.get(param)?.split(',').filter(Boolean) || [];
    const next = current.filter((v) => v !== val);
    const params = new URLSearchParams(searchParams);
    if (next.length === 0) params.delete(param); else params.set(param, next.join(','));
    setSearchParams(params);
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid #E8E3DB',
      borderRadius: '10px',
      padding: '14px 16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            border: '1px solid #E5E0D8',
            borderRadius: '6px',
            width: '220px',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            color: '#111827',
            background: '#FDFCF9',
          }}
        />
        <MultiSelect label="RAG Status" param="rag" options={RAG_OPTIONS} />
        <MultiSelect label="Report Status" param="report" options={REPORT_OPTIONS} />
        <MultiSelect label="Membership" param="membership" options={MEMBERSHIP_OPTIONS} />
        <MultiSelect label="Renewal Month" param="renewal" options={MONTHS} />
        <MultiSelect label="Add-Ons" param="addons" options={ADDON_OPTIONS} />
        {hasFilters && (
          <button
            onClick={() => setSearchParams({})}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '5px 10px', fontSize: '12px',
              color: '#DC2626', background: '#FEF2F2',
              border: '1px solid #FECACA', borderRadius: '6px',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      {hasFilters && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
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

      <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '10px' }}>
        {filteredCount === totalCount
          ? `${totalCount} accounts`
          : `${filteredCount} of ${totalCount} accounts`}
      </p>
    </div>
  );
}
