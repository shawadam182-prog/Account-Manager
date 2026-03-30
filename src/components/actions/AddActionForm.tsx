import { useState } from 'react';
import { addAction } from '../../services/actionsService';

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #E5E0D8',
  borderRadius: '6px',
  padding: '6px 8px',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  color: '#111827',
  background: '#FDFCF9',
};

export default function AddActionForm({
  accountId,
  meetingId,
  onSaved,
  onCancel,
}: {
  accountId: string | null;
  meetingId?: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('Millie');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [primaryHover, setPrimaryHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSaving(true);
    try {
      await addAction({
        account_id: accountId!,
        meeting_id: meetingId || null,
        description: description.trim(),
        owner,
        due_date: dueDate || null,
        status: 'Open',
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#F0FDF4',
        border: '1px solid #86EFAC',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Action description..."
        required
        autoFocus
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          style={{ ...inputStyle, width: 'auto' }}
        >
          <option value="Millie">Millie</option>
          <option value="Client">Client</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{ ...inputStyle, width: 'auto' }}
        />
        <div style={{ flex: 1 }} />
        <button
          type="submit"
          disabled={saving}
          onMouseEnter={() => setPrimaryHover(true)}
          onMouseLeave={() => setPrimaryHover(false)}
          style={{
            padding: '6px 12px',
            background: primaryHover ? '#15803D' : '#16a34a',
            color: 'white',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.5 : 1,
          }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          onMouseEnter={() => setCancelHover(true)}
          onMouseLeave={() => setCancelHover(false)}
          style={{
            padding: '6px 12px',
            background: cancelHover ? '#FDFCF9' : 'transparent',
            border: '1px solid #E5E0D8',
            color: '#6B7280',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
