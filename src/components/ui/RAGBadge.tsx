import type { RAGStatus } from '../../lib/types';

const colors: Record<string, string> = {
  Green: 'bg-green-500',
  Amber: 'bg-amber-500',
  Red: 'bg-red-500',
};

export default function RAGBadge({ status, showLabel = false }: { status: RAGStatus | null; showLabel?: boolean }) {
  const color = status ? colors[status] : 'bg-gray-300';
  const label = status || 'Not set';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      {showLabel && <span className="text-xs text-gray-600">{label}</span>}
    </span>
  );
}
