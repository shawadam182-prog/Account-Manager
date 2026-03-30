import type { MembershipLevel } from '../../lib/types';

const styles: Record<string, { bg: string; text: string; abbr: string }> = {
  'Business Certification': { bg: '#E8EDF2', text: '#374151', abbr: 'BC' },
  'Advanced':               { bg: '#DBEAFE', text: '#1D4ED8', abbr: 'ADV' },
  'Net Zero Committed':     { bg: '#DCFCE7', text: '#15803D', abbr: 'NZC' },
  'Multiple Tiers':         { bg: '#EDE9FE', text: '#7C3AED', abbr: 'MT' },
};

export default function MembershipBadge({ level, compact = false }: { level: MembershipLevel | null; compact?: boolean }) {
  if (!level) return <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>;
  const s = styles[level] || { bg: '#F3F4F6', text: '#6B7280', abbr: '?' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: compact ? '1px 6px' : '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.03em',
        background: s.bg,
        color: s.text,
        textTransform: 'uppercase',
      }}
    >
      {compact ? s.abbr : level}
    </span>
  );
}
