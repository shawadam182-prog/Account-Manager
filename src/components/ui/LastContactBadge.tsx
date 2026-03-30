export default function LastContactBadge({ days }: { days: number | null | undefined }) {
  if (days === null || days === undefined) {
    return <span className="text-xs text-gray-400">No meetings</span>;
  }

  const label = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`;

  if (days <= 14) {
    return <span className="text-xs text-emerald-600 font-medium">{label}</span>;
  }
  if (days <= 30) {
    return <span className="text-xs text-yellow-600 font-medium">{label}</span>;
  }
  if (days <= 60) {
    return <span className="text-xs text-orange-600 font-medium">{label}</span>;
  }
  return <span className="text-xs text-red-600 font-medium">{label}</span>;
}
