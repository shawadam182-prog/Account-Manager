import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Sparkles, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { callAI } from '../../services/aiService';
import { addMeeting } from '../../services/meetingsService';
import { addAction } from '../../services/actionsService';
import type { MeetingType } from '../../lib/types';

interface ProcessedResult {
  summary: string;
  meetingType: MeetingType;
  attendees: string;
  keyPoints: string[];
  actions: { description: string; owner: string }[];
  risks: string[];
  opportunities: string[];
  suggestedNotes: string;
}

export default function TranscriptUpload({
  accountId,
  accountName,
  accountContext,
  onSaved,
  onCancel,
}: {
  accountId: string;
  accountName: string;
  accountContext: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<'input' | 'processing' | 'review' | 'saving'>('input');
  const [transcript, setTranscript] = useState('');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [editedNotes, setEditedNotes] = useState('');
  const [editedAttendees, setEditedAttendees] = useState('');
  const [editedType, setEditedType] = useState<MeetingType>('Check-in');
  const [acceptedActions, setAcceptedActions] = useState<boolean[]>([]);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [showKeyPoints, setShowKeyPoints] = useState(true);

  const [uploadHover, setUploadHover] = useState(false);
  const [cancelHoverInput, setCancelHoverInput] = useState(false);
  const [cancelBtnHoverInput, setCancelBtnHoverInput] = useState(false);
  const [processHover, setProcessHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [keyPointsBtnHover, setKeyPointsBtnHover] = useState(false);
  const [saveBtnHover, setSaveBtnHover] = useState(false);
  const [discardBtnHover, setDiscardBtnHover] = useState(false);
  const [transcriptToggleHover, setTranscriptToggleHover] = useState(false);
  const [actionHoverIndex, setActionHoverIndex] = useState<number | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'txt' || ext === 'vtt' || ext === 'srt') {
      const text = await file.text();
      const cleaned = text
        .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3} --> \d{2}:\d{2}:\d{2}[.,]\d{3}/g, '')
        .replace(/^\d+$/gm, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      setTranscript(cleaned);
    } else if (ext === 'docx') {
      const buffer = await file.arrayBuffer();
      const mammoth = await import('mammoth');
      const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
      setTranscript(value);
    } else {
      setError('Unsupported file type. Please use .txt, .vtt, .srt, or .docx');
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      setError('Please paste or upload a transcript first.');
      return;
    }
    setError('');
    setStep('processing');

    try {
      const data = await callAI('processTranscript', {
        transcript: transcript.slice(0, 15000),
        accountName,
        accountContext,
      });

      if (data.error) throw new Error(data.error);

      setResult(data);
      setEditedNotes(data.suggestedNotes || '');
      setEditedAttendees(data.attendees || '');
      setEditedType(data.meetingType || 'Check-in');
      setAcceptedActions(data.actions.map(() => true));
      setStep('review');
    } catch (e) {
      setError(`Processing failed: ${String(e)}`);
      setStep('input');
    }
  };

  const saveMeeting = async () => {
    if (!result) return;
    setStep('saving');

    try {
      const meeting = await addMeeting({
        account_id: accountId,
        meeting_date: date,
        meeting_type: editedType,
        attendees: editedAttendees || null,
        notes: editedNotes || null,
        is_internal: false,
      });

      const actionsToSave = result.actions.filter((_, i) => acceptedActions[i]);
      await Promise.all(
        actionsToSave.map((a) =>
          addAction({
            account_id: accountId,
            meeting_id: meeting.id,
            description: a.description,
            owner: a.owner,
          })
        )
      );

      onSaved();
    } catch (e) {
      setError(`Save failed: ${String(e)}`);
      setStep('review');
    }
  };

  const MEETING_TYPES: MeetingType[] = ['Check-in', 'Renewal', 'Strategy', 'Data Review', 'Internal', 'Ad hoc'];

  const getOwnerBadgeStyle = (owner: string): React.CSSProperties => {
    if (owner === 'Millie') return { backgroundColor: '#DCFCE7', color: '#15803D' };
    if (owner === 'Client') return { backgroundColor: '#DBEAFE', color: '#1D4ED8' };
    return { backgroundColor: '#F5F0E8', color: '#6B7280' };
  };

  // --- Step: INPUT ---
  if (step === 'input') {
    return (
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #E8E3DB',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 500, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sparkles size={16} style={{ color: '#16a34a' }} />
            Process Transcript with AI
          </h3>
          <button
            onClick={onCancel}
            onMouseEnter={() => setCancelHoverInput(true)}
            onMouseLeave={() => setCancelHoverInput(false)}
            style={{
              color: cancelHoverInput ? '#6B7280' : '#9CA3AF',
              fontSize: '0.875rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>Meeting Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              border: '1px solid #E5E0D8',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
            Upload Transcript (.txt, .docx, .vtt, .srt)
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            onMouseEnter={() => setUploadHover(true)}
            onMouseLeave={() => setUploadHover(false)}
            style={{
              border: uploadHover ? '2px dashed #86EFAC' : '2px dashed #E8E3DB',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: uploadHover ? '#F0FDF4' : 'transparent',
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
          >
            {fileName ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.875rem', color: '#15803D' }}>
                <FileText size={16} />
                {fileName}
              </div>
            ) : (
              <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                <Upload size={20} style={{ margin: '0 auto 4px auto', display: 'block' }} />
                Click to upload, or paste below
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.docx,.vtt,.srt"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
            Or paste transcript text {transcript && `(${transcript.length.toLocaleString()} chars)`}
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={6}
            placeholder="Paste your meeting transcript here..."
            style={{
              width: '100%',
              border: '1px solid #E5E0D8',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#DC2626',
            fontSize: '0.875rem',
            backgroundColor: '#FFF1F2',
            borderRadius: '6px',
            padding: '8px 12px',
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={processTranscript}
            disabled={!transcript.trim()}
            onMouseEnter={() => setProcessHover(true)}
            onMouseLeave={() => setProcessHover(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: !transcript.trim() ? '#16a34a' : (processHover ? '#15803D' : '#16a34a'),
              color: 'white',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none',
              cursor: !transcript.trim() ? 'not-allowed' : 'pointer',
              opacity: !transcript.trim() ? 0.5 : 1,
            }}
          >
            <Sparkles size={14} />
            Process with AI
          </button>
          <button
            onClick={onCancel}
            onMouseEnter={() => setCancelBtnHoverInput(true)}
            onMouseLeave={() => setCancelBtnHoverInput(false)}
            style={{
              padding: '8px 16px',
              border: '1px solid #E5E0D8',
              color: '#6B7280',
              borderRadius: '10px',
              fontSize: '0.875rem',
              backgroundColor: cancelBtnHoverInput ? '#FDFCF9' : 'transparent',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // --- Step: PROCESSING ---
  if (step === 'processing') {
    return (
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #E8E3DB',
        borderRadius: '10px',
        padding: '32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
      }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#16a34a' }} />
        <p style={{ fontWeight: 500, color: '#111827', margin: 0 }}>Processing transcript...</p>
        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>Extracting summary, key points, and actions</p>
      </div>
    );
  }

  // --- Step: REVIEW ---
  if (step === 'review' && result) {
    return (
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #E8E3DB',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 500, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Check size={16} style={{ color: '#16a34a' }} />
            Review AI Summary
          </h3>
          <button
            onClick={() => setStep('input')}
            onMouseEnter={() => setBackHover(true)}
            onMouseLeave={() => setBackHover(false)}
            style={{
              fontSize: '0.75rem',
              color: backHover ? '#6B7280' : '#9CA3AF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #E5E0D8',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.75rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>Meeting Type</label>
            <select
              value={editedType}
              onChange={(e) => setEditedType(e.target.value as MeetingType)}
              style={{
                width: '100%',
                border: '1px solid #E5E0D8',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.75rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              {MEETING_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>Attendees</label>
            <input
              type="text"
              value={editedAttendees}
              onChange={(e) => setEditedAttendees(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #E5E0D8',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.75rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '10px',
          padding: '12px',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#15803D', marginBottom: '4px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={11} /> AI Summary
          </p>
          <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>{result.summary}</p>
        </div>

        {result.keyPoints?.length > 0 && (
          <div>
            <button
              onClick={() => setShowKeyPoints(!showKeyPoints)}
              onMouseEnter={() => setKeyPointsBtnHover(true)}
              onMouseLeave={() => setKeyPointsBtnHover(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: keyPointsBtnHover ? '#374151' : '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Key Points ({result.keyPoints.length})
              {showKeyPoints ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showKeyPoints && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {result.keyPoints.map((p, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: '#374151', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: '#9CA3AF', marginTop: '2px' }}>•</span> {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(result.risks?.length > 0 || result.opportunities?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {result.risks?.length > 0 && (
              <div style={{ backgroundColor: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '10px', padding: '12px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#B91C1C', marginBottom: '4px', marginTop: 0 }}>Risks flagged</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {result.risks.map((r, i) => (
                    <li key={i} style={{ fontSize: '0.75rem', color: '#B91C1C' }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.opportunities?.length > 0 && (
              <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '10px', padding: '12px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1D4ED8', marginBottom: '4px', marginTop: 0 }}>Opportunities</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {result.opportunities.map((o, i) => (
                    <li key={i} style={{ fontSize: '0.75rem', color: '#1D4ED8' }}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {result.actions?.length > 0 && (
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', marginTop: 0 }}>
              Actions ({result.actions.filter((_, i) => acceptedActions[i]).length} of {result.actions.length} selected)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {result.actions.map((a, i) => (
                <label
                  key={i}
                  onMouseEnter={() => setActionHoverIndex(i)}
                  onMouseLeave={() => setActionHoverIndex(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: actionHoverIndex === i ? '#FDFCF9' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={acceptedActions[i] ?? true}
                    onChange={(e) => {
                      const next = [...acceptedActions];
                      next[i] = e.target.checked;
                      setAcceptedActions(next);
                    }}
                    style={{ borderRadius: '4px', accentColor: '#16a34a' }}
                  />
                  <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>{a.description}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    ...getOwnerBadgeStyle(a.owner),
                  }}>
                    {a.owner}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Meeting Notes (edit before saving)
          </label>
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              border: '1px solid #E5E0D8',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.875rem',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <button
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            onMouseEnter={() => setTranscriptToggleHover(true)}
            onMouseLeave={() => setTranscriptToggleHover(false)}
            style={{
              fontSize: '0.75rem',
              color: transcriptToggleHover ? '#6B7280' : '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showFullTranscript ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showFullTranscript ? 'Hide' : 'Show'} original transcript
          </button>
          {showFullTranscript && (
            <pre style={{
              marginTop: '8px',
              fontSize: '0.75rem',
              color: '#9CA3AF',
              backgroundColor: '#FDFCF9',
              borderRadius: '6px',
              padding: '12px',
              maxHeight: '192px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
            }}>
              {transcript}
            </pre>
          )}
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#DC2626',
            fontSize: '0.875rem',
            backgroundColor: '#FFF1F2',
            borderRadius: '6px',
            padding: '8px 12px',
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid #F0EBE3' }}>
          <button
            onClick={saveMeeting}
            onMouseEnter={() => setSaveBtnHover(true)}
            onMouseLeave={() => setSaveBtnHover(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: saveBtnHover ? '#15803D' : '#16a34a',
              color: 'white',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Check size={14} />
            Save Meeting & Actions
          </button>
          <button
            onClick={onCancel}
            onMouseEnter={() => setDiscardBtnHover(true)}
            onMouseLeave={() => setDiscardBtnHover(false)}
            style={{
              padding: '8px 16px',
              border: '1px solid #E5E0D8',
              color: '#6B7280',
              borderRadius: '10px',
              fontSize: '0.875rem',
              backgroundColor: discardBtnHover ? '#FDFCF9' : 'transparent',
              cursor: 'pointer',
            }}
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

  // --- Step: SAVING ---
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #E8E3DB',
      borderRadius: '10px',
      padding: '32px',
      textAlign: 'center',
    }}>
      <Loader2 size={24} className="animate-spin" style={{ color: '#16a34a', margin: '0 auto 8px auto', display: 'block' }} />
      <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>Saving meeting and actions...</p>
    </div>
  );
}
