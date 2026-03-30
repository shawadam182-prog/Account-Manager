import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'Nothing here yet' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Inbox size={40} className="mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
