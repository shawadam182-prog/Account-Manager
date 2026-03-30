import { computeHealthScore, healthConfig } from '../../utils/healthScore';
import type { Account } from '../../lib/types';

export default function HealthBadge({ account }: { account: Account }) {
  const score = computeHealthScore(account);
  const config = healthConfig[score];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.text} ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
