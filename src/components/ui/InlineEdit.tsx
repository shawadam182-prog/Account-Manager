import { useState, useRef, useEffect } from 'react';

type Variant = 'text' | 'textarea' | 'select' | 'date' | 'number' | 'multiselect' | 'toggle';

interface InlineEditProps {
  value: string | number | boolean | string[] | null;
  variant?: Variant;
  options?: { value: string; label: string }[];
  onSave: (value: unknown) => Promise<void>;
  prefix?: string;
  placeholder?: string;
  locked?: boolean;
  renderValue?: (value: unknown) => React.ReactNode;
}

export default function InlineEdit({
  value,
  variant = 'text',
  options = [],
  onSave,
  prefix,
  placeholder = 'Click to edit',
  locked = false,
  renderValue,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<unknown>(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  if (variant === 'toggle') {
    return (
      <button
        onClick={async () => {
          if (locked) return;
          setSaving(true);
          try {
            await onSave(!value);
          } finally {
            setSaving(false);
          }
        }}
        disabled={saving || locked}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          value ? 'bg-emerald-500' : 'bg-gray-300'
        } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    );
  }

  if (variant === 'multiselect') {
    const selected = (Array.isArray(value) ? value : []) as string[];
    return (
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={async () => {
                if (locked) return;
                const next = isSelected
                  ? selected.filter((v) => v !== opt.value)
                  : [...selected, opt.value];
                setSaving(true);
                try {
                  await onSave(next);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || locked}
              className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                isSelected
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  const displayValue = () => {
    if (renderValue) return renderValue(value);
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">{placeholder}</span>;
    }
    if (variant === 'select') {
      const opt = options.find((o) => o.value === value);
      return opt?.label || String(value);
    }
    if (variant === 'number' && prefix) {
      return `${prefix}${Number(value).toLocaleString()}`;
    }
    return String(value);
  };

  if (!editing) {
    return (
      <span
        onClick={() => !locked && setEditing(true)}
        className={`inline-block min-w-[60px] rounded px-1 py-0.5 transition-colors ${
          locked
            ? 'text-gray-400 cursor-default'
            : 'hover:bg-gray-100 cursor-pointer'
        } ${saving ? 'opacity-50' : ''}`}
      >
        {displayValue()}
      </span>
    );
  }

  const handleSave = async () => {
    setEditing(false);
    if (draft === value) return;
    setSaving(true);
    try {
      await onSave(draft);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && variant !== 'textarea') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  };

  if (variant === 'textarea') {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={String(draft ?? '')}
        onChange={(e) => setDraft(e.target.value || null)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        rows={3}
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
      />
    );
  }

  if (variant === 'select') {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={String(draft ?? '')}
        onChange={(e) => {
          setDraft(e.target.value || null);
          setEditing(false);
          setSaving(true);
          onSave(e.target.value || null).finally(() => setSaving(false));
        }}
        onBlur={() => setEditing(false)}
        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
      >
        <option value="">Not set</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={variant === 'number' ? 'number' : variant === 'date' ? 'date' : 'text'}
      value={String(draft ?? '')}
      onChange={(e) => {
        const v = e.target.value;
        if (variant === 'number') {
          setDraft(v === '' ? null : Number(v));
        } else {
          setDraft(v || null);
        }
      }}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
    />
  );
}
