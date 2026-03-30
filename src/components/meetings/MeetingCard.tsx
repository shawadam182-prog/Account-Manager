import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Pencil, Check, X, Plus, Sparkles, Loader2 } from 'lucide-react';
import type { Meeting, Action } from '../../lib/types';
import { updateMeeting } from '../../services/meetingsService';
import { updateActionStatus, addAction } from '../../services/actionsService';
import { callAI } from '../../services/aiService';

const typeColors: Record<string, string> = {
  'Check-in':   'bg-blue-100 text-blue-700',
  'Renewal':    'bg-amber-100 text-amber-700',
  'Strategy':   'bg-purple-100 text-purple-700',
  'Data Review':'bg-teal-100 text-teal-700',
  'Internal':   'bg-gray-100 text-gray-600',
  'Ad hoc':     'bg-orange-100 text-orange-700',
};

interface SuggestedAction {
  description: string;
  owner: string;
  accepted?: boolean;
  dismissed?: boolean;
}

export default function MeetingCard({
  meeting,
  accountName,
  defaultExpanded = true,
  onRefresh,
}: {
  meeting: Meeting;
  accountName: string;
  defaultExpanded?: boolean;
  onRefresh?: () => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(meeting.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [addingAction, setAddingAction] = useState(false);
  const [newActionDesc, setNewActionDesc] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('Millie');
  const [actions, setActions] = useState<Action[]>(meeting.actions || []);
  const [extracting, setExtracting] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedAction[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingNotes && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editingNotes, notesValue]);

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateMeeting(meeting.id, { notes: notesValue });
      setEditingNotes(false);
      if (notesValue.length > 100) {
        extractActions(notesValue);
      }
    } finally {
      setSavingNotes(false);
    }
  };

  const cancelNotes = () => {
    setNotesValue(meeting.notes || '');
    setEditingNotes(false);
  };

  const extractActions = async (notes: string) => {
    setExtracting(true);
    try {
      const result = await callAI('extractActions', {
        notes,
        accountName,
        meetingType: meeting.meeting_type,
      });
      if (result?.actions?.length > 0) {
        const existingDescs = actions.map((a) => a.description.toLowerCase());
        const newSuggestions = result.actions.filter(
          (s: SuggestedAction) => !existingDescs.some((d) => d.includes(s.description.toLowerCase().slice(0, 20)))
        );
        if (newSuggestions.length > 0) setSuggested(newSuggestions);
      }
    } catch (e) {
      console.error('AI extraction failed', e);
    } finally {
      setExtracting(false);
    }
  };

  const acceptSuggestion = async (idx: number) => {
    const s = suggested[idx];
    setSuggested((prev) => prev.map((item, i) => i === idx ? { ...item, accepted: true } : item));
    const newAction = await addAction({
      account_id: meeting.account_id!,
      meeting_id: meeting.id,
      description: s.description,
      owner: s.owner,
    });
    setActions((prev) => [...prev, newAction]);
  };

  const dismissSuggestion = (idx: number) => {
    setSuggested((prev) => prev.map((item, i) => i === idx ? { ...item, dismissed: true } : item));
  };

  const toggleAction = async (action: Action) => {
    const newStatus = action.status === 'Done' ? 'Open' : 'Done';
    setActions((prev) => prev.map((a) => a.id === action.id ? { ...a, status: newStatus } : a));
    await updateActionStatus(action.id, newStatus);
    onRefresh?.();
  };

  const submitNewAction = async () => {
    if (!newActionDesc.trim() || !meeting.account_id) return;
    const action = await addAction({
      account_id: meeting.account_id,
      meeting_id: meeting.id,
      description: newActionDesc.trim(),
      owner: newActionOwner,
    });
    setActions((prev) => [...prev, action]);
    setNewActionDesc('');
    setAddingAction(false);
    onRefresh?.();
  };

  const visibleSuggestions = suggested.filter((s) => !s.dismissed);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <button onClick={() => setExpanded(!expanded)} className="mt-0.5 text-gray-400 hover:text-gray-600 shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="flex-1 min-w-0">

          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">
              {new Date(meeting.meeting_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[meeting.meeting_type] || 'bg-gray-100 text-gray-600'}`}>
              {meeting.meeting_type}
            </span>
            {meeting.attendees && (
              <span className="text-xs text-gray-500">with {meeting.attendees}</span>
            )}
          </div>

          {/* Collapsed preview */}
          {!expanded && meeting.notes && (
            <p className="text-sm text-gray-500 mt-1 truncate">{meeting.notes.slice(0, 100)}...</p>
          )}

          {/* Expanded content */}
          {expanded && (
            <div className="mt-3 space-y-3">

              {/* Notes section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</span>
                  {!editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <Pencil size={11} /> Edit
                    </button>
                  )}
                </div>

                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      ref={textareaRef}
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none min-h-[80px]"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveNotes}
                        disabled={savingNotes}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white rounded text-xs font-medium hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <Check size={12} />
                        {savingNotes ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelNotes}
                        className="inline-flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50"
                      >
                        <X size={12} /> Cancel
                      </button>
                      {notesValue.length > 100 && (
                        <button
                          onClick={() => extractActions(notesValue)}
                          disabled={extracting}
                          className="inline-flex items-center gap-1 px-3 py-1 border border-emerald-300 text-emerald-700 rounded text-xs hover:bg-emerald-50 ml-auto"
                        >
                          {extracting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          Extract actions
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {meeting.notes || <span className="text-gray-400 italic">No notes recorded.</span>}
                  </div>
                )}
              </div>

              {/* AI extracting indicator */}
              {extracting && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded px-3 py-2">
                  <Loader2 size={12} className="animate-spin" />
                  Extracting suggested actions...
                </div>
              )}

              {/* AI suggested actions */}
              {visibleSuggestions.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    <Sparkles size={12} />
                    {visibleSuggestions.length} suggested action{visibleSuggestions.length > 1 ? 's' : ''} from notes
                  </p>
                  {suggested.map((s, i) => !s.dismissed && (
                    <div key={i} className={`flex items-center gap-2 ${s.accepted ? 'opacity-50' : ''}`}>
                      <span className="flex-1 text-xs text-gray-700">{s.description}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${s.owner === 'Millie' ? 'bg-emerald-100 text-emerald-700' : s.owner === 'Client' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {s.owner}
                      </span>
                      {!s.accepted && (
                        <>
                          <button
                            onClick={() => acceptSuggestion(i)}
                            className="px-2 py-0.5 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => dismissSuggestion(i)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                      {s.accepted && <Check size={12} className="text-emerald-500" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Actions {actions.length > 0 && `(${actions.filter(a => a.status === 'Open').length} open)`}
                  </p>
                  {!addingAction && (
                    <button
                      onClick={() => setAddingAction(true)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <Plus size={11} /> Add
                    </button>
                  )}
                </div>

                {/* Inline add action */}
                {addingAction && (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newActionDesc}
                      onChange={(e) => setNewActionDesc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitNewAction(); if (e.key === 'Escape') setAddingAction(false); }}
                      placeholder="Action description..."
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      autoFocus
                    />
                    <select
                      value={newActionOwner}
                      onChange={(e) => setNewActionOwner(e.target.value)}
                      className="border border-gray-300 rounded px-1.5 py-1 text-xs outline-none"
                    >
                      <option>Millie</option>
                      <option>Client</option>
                      <option>Internal</option>
                    </select>
                    <button onClick={submitNewAction} className="p-1 text-emerald-600 hover:text-emerald-700">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setAddingAction(false)} className="p-1 text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Actions list */}
                <div className="space-y-1.5">
                  {actions.map((action) => (
                    <label key={action.id} className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={action.status === 'Done'}
                        onChange={() => toggleAction(action)}
                        className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className={`text-sm flex-1 ${action.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {action.description}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${action.owner === 'Millie' ? 'bg-emerald-100 text-emerald-700' : action.owner === 'Client' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {action.owner}
                      </span>
                    </label>
                  ))}
                  {actions.length === 0 && !addingAction && (
                    <p className="text-xs text-gray-400 italic">No actions recorded</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
