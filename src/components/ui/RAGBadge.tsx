import type { RAGStatus } from '../../lib/types';

const config: Record<string, { bg: string; border: string; dot: string }> = {
  Green: { bg: '#F0FDF4', border: '#86EFAC', dot: '#16A34A' },
  Amber: { bg: '#FFFBEB', border: '#FCD34D', dot: '#D97706' },
  Red:   { bg: '#FFF1F2', border: '#FDA4AF', dot: '#E11D48' },
};

export default function RAGBadge({ status, showLabel = false }: { status: RAGStatus | null; showLabel?: boolean }) {
  const c = status ? config[status] : null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: showLabel ? '2px 8px' : '2px 6px',
        borderRadius: '20px',
        border: `1px solid ${c?.border || '#D1D5DB'}`,
        background: c?.bg || '#F9FAFB',
        fontSize: '12px',
        fontWeight: 500,
        color: '#374151',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: c?.dot || '#D1D5DB',
          flexShrink: 0,
        }}
      />
      {showLabel && (status || 'Not set')}
    </span>
  );
}
