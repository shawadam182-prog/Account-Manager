const colorByDays = (days: number): string => {
  if (days <= 14) return '#16a34a';
  if (days <= 30) return '#d97706';
  if (days <= 60) return '#ea580c';
  return '#dc2626';
};

export default function LastContactBadge({ days }: { days: number | null | undefined }) {
  if (days === null || days === undefined) {
    return <span style={{ fontSize: '12px', color: '#9CA3AF' }}>No meetings</span>;
  }

  const label = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`;

  return (
    <span style={{ fontSize: '12px', fontWeight: 500, color: colorByDays(days) }}>
      {label}
    </span>
  );
}
