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
        style={{
          position: 'relative',
          display: 'inline-flex',
          height: '20px',
          width: '36px',
          alignItems: 'center',
          borderRadius: '9999px',
          transition: 'background-color 0.15s ease',
          backgroundColor: value ? '#16a34a' : '#D1C9BC',
          opacity: locked ? 0.5 : 1,
          cursor: locked ? 'not-allowed' : 'pointer',
          border: 'none',
          padding: 0,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            height: '14px',
            width: '14px',
            borderRadius: '9999px',
            backgroundColor: '#ffffff',
            transition: 'transform 0.15s ease',
            transform: value ? 'translateX(18px)' : 'translateX(2px)',
          }}
        />
      </button>
    );
  }

  if (variant === 'multiselect') {
    const selected = (Array.isArray(value) ? value : []) as string[];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
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
              style={{
                paddingLeft: '8px',
                paddingRight: '8px',
                paddingTop: '2px',
                paddingBottom: '2px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                lineHeight: '1rem',
                borderWidth: '1px',
                borderStyle: 'solid',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                backgroundColor: isSelected ? '#DCFCE7' : '#FDFCF9',
                borderColor: isSelected ? '#86EFAC' : '#E5E0D8',
                color: isSelected ? '#15803D' : '#9CA3AF',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F5F0E8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FDFCF9';
                }
              }}
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
      return (
        <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
          {placeholder}
        </span>
      );
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
        style={{
          display: 'inline-block',
          minWidth: '60px',
          borderRadius: '6px',
          paddingLeft: '4px',
          paddingRight: '4px',
          paddingTop: '2px',
          paddingBottom: '2px',
          transition: 'background-color 0.15s ease',
          color: locked ? '#9CA3AF' : undefined,
          cursor: locked ? 'default' : 'pointer',
          opacity: saving ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!locked) {
            (e.currentTarget as HTMLSpanElement).style.backgroundColor = '#F5F0E8';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLSpanElement).style.backgroundColor = 'transparent';
        }}
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

  const inputStyle: React.CSSProperties = {
    border: '1px solid #E5E0D8',
    borderRadius: '6px',
    paddingLeft: '8px',
    paddingRight: '8px',
    paddingTop: '4px',
    paddingBottom: '4px',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    outline: 'none',
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
        style={{
          ...inputStyle,
          width: '100%',
        }}
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
        style={inputStyle}
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
      style={inputStyle}
    />
  );
}
