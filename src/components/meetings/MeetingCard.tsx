import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Meeting, Action } from '../../lib/types';
import { updateActionStatus } from '../../services/actionsService';

const typeColors: Record<string, string> = {
  'Check-in': 'bg-blue-100 text-blue-700',
  'Renewal': 'bg-amber-100 text-amber-700',
  'Strategy': 'bg-purple-100 text-purple-700',
  'Data Review': 'bg-teal-100 text-teal-700',
  'Internal': 'bg-gray-100 text-gray-600',
  'Ad hoc': 'bg-orange-100 text-orange-700',
};

export default function MeetingCard({
  meeting,
  defaultExpanded = true,
  onActionToggle,
}: {
  meeting: Meeting;
  defaultExpanded?: boolean;
  onActionToggle?: () => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const actions = meeting.actions || [];

  const toggleAction = async (action: Action) => {
    const newStatus = action.status === 'Done' ? 'Open' : 'Done';
    await updateActionStatus(action.id, newStatus);
    onActionToggle?.();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <button onClick={() => setExpanded(!expanded)} className="mt-0.5 text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">
              {new Date(meeting.meeting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[meeting.meeting_type] || 'bg-gray-100 text-gray-600'}`}>
              {meeting.meeting_type}
            </span>
            {meeting.attendees && (
              <span className="text-xs text-gray-500">with {meeting.attendees}</span>
            )}
          </div>

          {!expanded && meeting.notes && (
            <p className="text-sm text-gray-500 mt-1 truncate">{meeting.notes.slice(0, 100)}...</p>
          )}

          {expanded && (
            <div className="mt-3 space-y-3">
              {meeting.notes && (
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {meeting.notes}
                </div>
              )}

              {actions.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Actions</p>
                  <div className="space-y-1.5">
                    {actions.map((action) => (
                      <label key={action.id} className="flex items-start gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={action.status === 'Done'}
                          onChange={() => toggleAction(action)}
                          className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className={`text-sm ${action.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {action.description}
                        </span>
                        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${action.owner === 'Millie' ? 'bg-emerald-100 text-emerald-700' : action.owner === 'Client' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {action.owner}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
