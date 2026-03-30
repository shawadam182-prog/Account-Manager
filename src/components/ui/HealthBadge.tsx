import { computeHealthScore, healthConfig } from '../../utils/healthScore';
import type { Account } from '../../lib/types';

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
        background: config.bg,
        color: config.text,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: config.dot,
        }}
      />
      {config.label}
    </span>
  );
}
