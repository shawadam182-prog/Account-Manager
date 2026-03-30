import type { ReportStatus } from '../../lib/types';

const styles: Record<string, string> = {
  'Overdue': 'bg-red-100 text-red-700',
  'In progress': 'bg-amber-100 text-amber-700',
  'Report Delivered': 'bg-green-100 text-green-700',
  'Data Submitted': 'bg-teal-100 text-teal-700',
};

export default function StatusBadge({ status }: { status: ReportStatus | null }) {
  if (!status) return <span className="text-xs text-gray-400">-</span>;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
