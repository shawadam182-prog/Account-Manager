import type { Account } from '../lib/types';

export type HealthScore = 'healthy' | 'monitor' | 'risk' | 'critical';

export function computeHealthScore(account: Account): HealthScore {
  // Manual override takes priority
  if (account.health_override) return account.health_override as HealthScore;

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

export const healthConfig: Record<HealthScore, { label: string; dot: string; text: string; bg: string; border: string }> = {
  healthy:  { label: 'Healthy',  dot: '#16a34a', text: '#15803D', bg: '#F0FDF4', border: '#16a34a' },
  monitor:  { label: 'Monitor',  dot: '#d97706', text: '#92400E', bg: '#FFFBEB', border: '#d97706' },
  risk:     { label: 'At Risk',  dot: '#ea580c', text: '#9A3412', bg: '#FFF7ED', border: '#ea580c' },
  critical: { label: 'Critical', dot: '#dc2626', text: '#9F1239', bg: '#FFF1F2', border: '#dc2626' },
};
