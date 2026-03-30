import { useState } from 'react';
import type { MeetingType } from '../../lib/types';
import { addMeeting } from '../../services/meetingsService';

const MEETING_TYPES: MeetingType[] = ['Check-in', 'Renewal', 'Strategy', 'Data Review', 'Internal', 'Ad hoc'];

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

export default function AddMeetingForm({
  accountId,
  onSaved,
  onCancel,
}: {
  accountId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<MeetingType>('Check-in');
  const [attendees, setAttendees] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [primaryHover, setPrimaryHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addMeeting({
        account_id: accountId,
        meeting_date: date,
        meeting_type: type,
        attendees: attendees || null,
        notes: notes || null,
        is_internal: type === 'Internal',
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
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
            Meeting Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MeetingType)}
            style={inputStyle}
          >
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
          Attendees
        </label>
        <input
          type="text"
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
          placeholder="e.g. Sarah, Tom"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
          disabled={saving}
          onMouseEnter={() => setPrimaryHover(true)}
          onMouseLeave={() => setPrimaryHover(false)}
          style={{
            padding: '6px 16px',
            background: primaryHover ? '#15803D' : '#16a34a',
            color: 'white',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Meeting'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          onMouseEnter={() => setCancelHover(true)}
          onMouseLeave={() => setCancelHover(false)}
          style={{
            padding: '6px 16px',
            background: cancelHover ? '#FDFCF9' : 'transparent',
            border: '1px solid #E5E0D8',
            color: '#6B7280',
            borderRadius: '10px',
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
