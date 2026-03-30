import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'Nothing here yet' }: { message?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 0',
        color: '#9CA3AF',
      }}
    >
      <Inbox size={40} style={{ marginBottom: '12px' }} />
      <p style={{ fontSize: '13px' }}>{message}</p>
    </div>
  );
}
