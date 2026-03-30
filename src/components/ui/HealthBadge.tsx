import { computeHealthScore, healthConfig } from '../../utils/healthScore';
import type { Account } from '../../lib/types';

const dotColors = {
  healthy:  '#16a34a',
  monitor:  '#d97706',
  risk:     '#ea580c',
  critical: '#dc2626',
};

const bgColors = {
  healthy:  '#F0FDF4',
  monitor:  '#FFFBEB',
  risk:     '#FFF7ED',
  critical: '#FFF1F2',
};

const textColors = {
  healthy:  '#15803D',
  monitor:  '#92400E',
  risk:     '#9A3412',
  critical: '#9F1239',
};

export default function HealthBadge({ account }: { account: Account }) {
  const score = computeHealthScore(account);
  const config = healthConfig[score];
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
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        background: bgColors[score],
        color: textColors[score],
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: dotColors[score],
        }}
      />
      {config.label}
    </span>
  );
}
