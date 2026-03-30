import type { MembershipLevel } from '../../lib/types';

const styles: Record<string, string> = {
  'Business Certification': 'bg-slate-100 text-slate-700',
  'Advanced': 'bg-blue-100 text-blue-700',
  'Net Zero Committed': 'bg-green-100 text-green-700',
  'Multiple Tiers': 'bg-purple-100 text-purple-700',
};

export default function MembershipBadge({ level }: { level: MembershipLevel | null }) {
  if (!level) return <span className="text-xs text-gray-400">-</span>;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[level] || 'bg-gray-100 text-gray-600'}`}>
      {level}
    </span>
  );
}
