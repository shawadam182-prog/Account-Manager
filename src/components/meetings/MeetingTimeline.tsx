import type { Meeting } from '../../lib/types';
import MeetingCard from './MeetingCard';
import EmptyState from '../ui/EmptyState';

export default function MeetingTimeline({
  meetings,
  accountName,
  onRefresh,
}: {
  meetings: Meeting[];
  accountName: string;
  onRefresh: () => void;
}) {
  if (meetings.length === 0) {
    return <EmptyState message="No meetings recorded yet" />;
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting, idx) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          accountName={accountName}
          defaultExpanded={idx < 5}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
