import { useState } from 'react';
import type { MeetingType } from '../../lib/types';
import { addMeeting } from '../../services/meetingsService';

const MEETING_TYPES: MeetingType[] = ['Check-in', 'Renewal', 'Strategy', 'Data Review', 'Internal', 'Ad hoc'];

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
    <form onSubmit={handleSubmit} className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Meeting Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MeetingType)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Attendees</label>
        <input
          type="text"
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
          placeholder="e.g. Sarah, Tom"
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Meeting'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
