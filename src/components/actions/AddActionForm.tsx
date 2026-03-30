import { useState } from 'react';
import { addAction } from '../../services/actionsService';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSaving(true);
    try {
      await addAction({
        account_id: accountId,
        meeting_id: meetingId || null,
        description: description.trim(),
        owner,
        due_date: dueDate || null,
        status: 'Open',
        completed_at: null,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Action description..."
        required
        autoFocus
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
      />
      <div className="flex gap-2 items-center">
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        >
          <option value="Millie">Millie</option>
          <option value="Client">Client</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
        <div className="flex-1" />
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 bg-emerald-500 text-white rounded text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
