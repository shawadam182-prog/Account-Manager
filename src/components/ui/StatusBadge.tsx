import type { ReportStatus } from '../../lib/types';

const styles: Record<string, { bg: string; text: string; dot: string }> = {
  'Overdue':              { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
  'In progress':          { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  'Extra Data Requested': { bg: '#FFEDD5', text: '#9A3412', dot: '#EA580C' },
  'Report Final Checks':  { bg: '#DBEAFE', text: '#1E3A8A', dot: '#2563EB' },
  'Report Delivered':     { bg: '#DCFCE7', text: '#14532D', dot: '#16A34A' },
  'Data Submitted':       { bg: '#CFFAFE', text: '#164E63', dot: '#0891B2' },
};

export default function StatusBadge({ status }: { status: ReportStatus | null }) {
  if (!status) return <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>;
  const s = styles[status] || { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        background: s.bg,
        color: s.text,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}
