import type { Account } from '../lib/types';

export type HealthScore = 'healthy' | 'monitor' | 'risk' | 'critical';

export function computeHealthScore(account: Account): HealthScore {
  let score = 0;

  // RAG status
  if (account.rag_status === 'Green') score += 2;
  else if (account.rag_status === 'Amber') score += 0;
  else if (account.rag_status === 'Red') score -= 2;

  // Report status
  if (account.report_status === 'Report Delivered' || account.report_status === 'Data Submitted') score += 2;
  else if (account.report_status === 'In progress') score += 1;
  else if (account.report_status === 'Overdue') score -= 2;

  // Days since contact
  const days = account.days_since_contact;
  if (days === null || days === undefined) score -= 1;
  else if (days <= 14) score += 2;
  else if (days <= 30) score += 1;
  else if (days <= 60) score += 0;
  else score -= 1;

  // Overdue actions
  if ((account.overdue_actions_count ?? 0) > 0) score -= 1;

  // No membership data = incomplete/shell account, don't score as critical
  if (!account.membership_level && !account.rag_status && !account.report_status) {
    return 'monitor';
  }

  if (score >= 5) return 'healthy';
  if (score >= 3) return 'monitor';
  if (score >= 1) return 'risk';
  return 'critical';
}

export const healthConfig: Record<HealthScore, { label: string; dot: string; text: string; bg: string }> = {
  healthy:  { label: 'Healthy',  dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  monitor:  { label: 'Monitor',  dot: 'bg-yellow-400',  text: 'text-yellow-700',  bg: 'bg-yellow-50'  },
  risk:     { label: 'At Risk',  dot: 'bg-orange-500',  text: 'text-orange-700',  bg: 'bg-orange-50'  },
  critical: { label: 'Critical', dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50'     },
};
