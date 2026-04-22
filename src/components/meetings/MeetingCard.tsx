import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Pencil, Check, X, Plus, Sparkles, Loader2, Trash2 } from 'lucide-react';
import type { Meeting, Action } from '../../lib/types';
import { updateMeeting, deleteMeeting } from '../../services/meetingsService';
import { updateActionStatus, addAction } from '../../services/actionsService';
import { callAI } from '../../services/aiService';

const typeColors: Record<string, { bg: string; text: string }> = {
  'Check-in':    { bg: '#DBEAFE', text: '#1D4ED8' },
  'Renewal':     { bg: '#FEF3C7', text: '#92400E' },
  'Strategy':    { bg: '#EDE9FE', text: '#7C3AED' },
  'Data Review': { bg: '#CCFBF1', text: '#0F766E' },
  'Internal':    { bg: '#F5F0E8', text: '#6B7280' },
  'Ad hoc':      { bg: '#FFEDD5', text: '#C2410C' },
};

const defaultTypeColor = { bg: '#F5F0E8', text: '#6B7280' };

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
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDelete = async () => {
    if (!confirm('Delete this meeting? This cannot be undone. Any linked actions will also be deleted.')) return;
    setDeleting(true);
    try {
      await deleteMeeting(meeting.id);
      onRefresh?.();
    } finally {
      setDeleting(false);
    }
  };

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

  const ownerBadgeStyle = (owner: string): React.CSSProperties => {
    if (owner === 'Millie') return { backgroundColor: '#DCFCE7', color: '#15803D' };
    if (owner === 'Client') return { backgroundColor: '#DBEAFE', color: '#1D4ED8' };
    return { backgroundColor: '#F5F0E8', color: '#6B7280' };
  };

  const tc = typeColors[meeting.meeting_type] || defaultTypeColor;

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #E8E3DB', borderRadius: '10px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: '2px',
            color: '#9CA3AF',
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
              {new Date(meeting.meeting_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span
              style={{
                paddingLeft: '8px',
                paddingRight: '8px',
                paddingTop: '2px',
                paddingBottom: '2px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: tc.bg,
                color: tc.text,
              }}
            >
              {meeting.meeting_type}
            </span>
            {meeting.attendees && (
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>with {meeting.attendees}</span>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete meeting"
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#9CA3AF',
                background: 'none',
                border: 'none',
                borderRadius: '6px',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.backgroundColor = '#FEF2F2'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Trash2 size={12} /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          {/* Collapsed preview */}
          {!expanded && meeting.notes && (
            <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meeting.notes.slice(0, 100)}...
            </p>
          )}

          {/* Expanded content */}
          {expanded && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Notes section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</span>
                  {!editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#9CA3AF',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <Pencil size={11} /> Edit
                    </button>
                  )}
                </div>

                {editingNotes ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      ref={textareaRef}
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      style={{
                        width: '100%',
                        border: '1px solid #E5E0D8',
                        borderRadius: '6px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'none',
                        minHeight: '80px',
                        boxSizing: 'border-box',
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={saveNotes}
                        disabled={savingNotes}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          border: 'none',
                          cursor: 'pointer',
                          opacity: savingNotes ? 0.5 : 1,
                        }}
                      >
                        <Check size={12} />
                        {savingNotes ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelNotes}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          border: '1px solid #E5E0D8',
                          color: '#6B7280',
                          borderRadius: '6px',
                          fontSize: '12px',
                          background: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} /> Cancel
                      </button>
                      {notesValue.length > 100 && (
                        <button
                          onClick={() => extractActions(notesValue)}
                          disabled={extracting}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            paddingLeft: '12px',
                            paddingRight: '12px',
                            paddingTop: '4px',
                            paddingBottom: '4px',
                            border: '1px solid #86EFAC',
                            color: '#15803D',
                            borderRadius: '6px',
                            fontSize: '12px',
                            background: 'none',
                            cursor: 'pointer',
                            marginLeft: 'auto',
                          }}
                        >
                          {extracting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          Extract actions
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.625 }}>
                    {meeting.notes || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No notes recorded.</span>}
                  </div>
                )}
              </div>

              {/* AI extracting indicator */}
              {extracting && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#16a34a', backgroundColor: '#F0FDF4', borderRadius: '6px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px' }}>
                  <Loader2 size={12} className="animate-spin" />
                  Extracting suggested actions...
                </div>
              )}

              {/* AI suggested actions */}
              {visibleSuggestions.length > 0 && (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#15803D', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                    <Sparkles size={12} />
                    {visibleSuggestions.length} suggested action{visibleSuggestions.length > 1 ? 's' : ''} from notes
                  </p>
                  {suggested.map((s, i) => !s.dismissed && (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: s.accepted ? 0.5 : 1 }}>
                      <span style={{ flex: 1, fontSize: '12px', color: '#374151' }}>{s.description}</span>
                      <span
                        style={{
                          fontSize: '12px',
                          paddingLeft: '6px',
                          paddingRight: '6px',
                          paddingTop: '2px',
                          paddingBottom: '2px',
                          borderRadius: '6px',
                          ...ownerBadgeStyle(s.owner),
                        }}
                      >
                        {s.owner}
                      </span>
                      {!s.accepted && (
                        <>
                          <button
                            onClick={() => acceptSuggestion(i)}
                            style={{
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: '2px',
                              paddingBottom: '2px',
                              backgroundColor: '#16a34a',
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '12px',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => dismissSuggestion(i)}
                            style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                      {s.accepted && <Check size={12} style={{ color: '#16a34a' }} />}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ borderTop: '1px solid #F0EBE3', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Actions {actions.length > 0 && `(${actions.filter(a => a.status === 'Open').length} open)`}
                  </p>
                  {!addingAction && (
                    <button
                      onClick={() => setAddingAction(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#9CA3AF',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <Plus size={11} /> Add
                    </button>
                  )}
                </div>

                {/* Inline add action */}
                {addingAction && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={newActionDesc}
                      onChange={(e) => setNewActionDesc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitNewAction(); if (e.key === 'Escape') setAddingAction(false); }}
                      placeholder="Action description..."
                      style={{
                        flex: 1,
                        border: '1px solid #E5E0D8',
                        borderRadius: '6px',
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      autoFocus
                    />
                    <select
                      value={newActionOwner}
                      onChange={(e) => setNewActionOwner(e.target.value)}
                      style={{
                        border: '1px solid #E5E0D8',
                        borderRadius: '6px',
                        paddingLeft: '6px',
                        paddingRight: '6px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      <option>Millie</option>
                      <option>Client</option>
                      <option>Internal</option>
                    </select>
                    <button
                      onClick={submitNewAction}
                      style={{ padding: '4px', color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setAddingAction(false)}
                      style={{ padding: '4px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Actions list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {actions.map((action) => (
                    <label key={action.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={action.status === 'Done'}
                        onChange={() => toggleAction(action)}
                        style={{ marginTop: '2px', accentColor: '#16a34a' }}
                      />
                      <span
                        style={{
                          fontSize: '14px',
                          flex: 1,
                          textDecoration: action.status === 'Done' ? 'line-through' : 'none',
                          color: action.status === 'Done' ? '#9CA3AF' : '#374151',
                        }}
                      >
                        {action.description}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          paddingLeft: '6px',
                          paddingRight: '6px',
                          paddingTop: '2px',
                          paddingBottom: '2px',
                          borderRadius: '6px',
                          ...ownerBadgeStyle(action.owner),
                        }}
                      >
                        {action.owner}
                      </span>
                    </label>
                  ))}
                  {actions.length === 0 && !addingAction && (
                    <p style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>No actions recorded</p>
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
