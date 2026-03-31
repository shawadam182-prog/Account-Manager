import type { Account, Action } from '../lib/types';

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportAccountsCsv(accounts: Account[]) {
  const headers = [
    'Company Name', 'Membership Level', 'RAG Status', 'Report Status',
    'Main POC', 'Renewal Month', 'Current ARR', 'Opportunity Value',
    'Industry', 'Open Actions', 'Days Since Contact',
  ];
  const rows = accounts.map((a) => [
    a.company_name, a.membership_level, a.rag_status, a.report_status,
    a.main_poc, a.renewal_month, a.current_arr, a.opportunity_value,
    a.industry, a.open_actions_count ?? 0, a.days_since_contact ?? '',
  ].map(escapeCsv).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  downloadCsv(`accounts-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

export function exportActionsCsv(actions: Action[]) {
  const headers = ['Description', 'Owner', 'Status', 'Priority', 'Category', 'Due Date', 'Account', 'Notes', 'Created'];
  const rows = actions.map((a) => [
    a.description, a.owner, a.status, a.priority ?? 'Medium', a.category ?? '',
    a.due_date ?? '', a.account?.company_name ?? '', a.notes ?? '',
    a.created_at?.slice(0, 10) ?? '',
  ].map(escapeCsv).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  downloadCsv(`actions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
