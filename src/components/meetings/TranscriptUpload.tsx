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

  // --- Step: INPUT ---
  if (step === 'input') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500" />
            Process Transcript with AI
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Meeting Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Upload Transcript (.txt, .docx, .vtt, .srt)
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
          >
            {fileName ? (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                <FileText size={16} />
                {fileName}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">
                <Upload size={20} className="mx-auto mb-1" />
                Click to upload, or paste below
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.docx,.vtt,.srt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Or paste transcript text {transcript && `(${transcript.length.toLocaleString()} chars)`}
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={6}
            placeholder="Paste your meeting transcript here..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none resize-none font-mono text-xs"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded px-3 py-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={processTranscript}
            disabled={!transcript.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={14} />
            Process with AI
          </button>
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // --- Step: PROCESSING ---
  if (step === 'processing') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center space-y-3">
        <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto" />
        <p className="font-medium text-gray-900">Processing transcript...</p>
        <p className="text-sm text-gray-500">Extracting summary, key points, and actions</p>
      </div>
    );
  }

  // --- Step: REVIEW ---
  if (step === 'review' && result) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Check size={16} className="text-emerald-500" />
            Review AI Summary
          </h3>
          <button onClick={() => setStep('input')} className="text-xs text-gray-400 hover:text-gray-600">
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meeting Type</label>
            <select value={editedType} onChange={(e) => setEditedType(e.target.value as MeetingType)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500">
              {MEETING_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Attendees</label>
            <input type="text" value={editedAttendees} onChange={(e) => setEditedAttendees(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
          <p className="text-xs font-medium text-emerald-700 mb-1 flex items-center gap-1">
            <Sparkles size={11} /> AI Summary
          </p>
          <p className="text-sm text-gray-700">{result.summary}</p>
        </div>

        {result.keyPoints?.length > 0 && (
          <div>
            <button
              onClick={() => setShowKeyPoints(!showKeyPoints)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 hover:text-gray-700"
            >
              Key Points ({result.keyPoints.length})
              {showKeyPoints ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showKeyPoints && (
              <ul className="space-y-1">
                {result.keyPoints.map((p, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span> {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(result.risks?.length > 0 || result.opportunities?.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {result.risks?.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-xs font-medium text-red-700 mb-1">Risks flagged</p>
                <ul className="space-y-1">
                  {result.risks.map((r, i) => (
                    <li key={i} className="text-xs text-red-700">{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.opportunities?.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-700 mb-1">Opportunities</p>
                <ul className="space-y-1">
                  {result.opportunities.map((o, i) => (
                    <li key={i} className="text-xs text-blue-700">{o}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {result.actions?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Actions ({result.actions.filter((_, i) => acceptedActions[i]).length} of {result.actions.length} selected)
            </p>
            <div className="space-y-1.5">
              {result.actions.map((a, i) => (
                <label key={i} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={acceptedActions[i] ?? true}
                    onChange={(e) => {
                      const next = [...acceptedActions];
                      next[i] = e.target.checked;
                      setAcceptedActions(next);
                    }}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="flex-1 text-sm text-gray-700">{a.description}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${a.owner === 'Millie' ? 'bg-emerald-100 text-emerald-700' : a.owner === 'Client' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {a.owner}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Meeting Notes (edit before saving)
          </label>
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
          />
        </div>

        <div>
          <button
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            {showFullTranscript ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showFullTranscript ? 'Hide' : 'Show'} original transcript
          </button>
          {showFullTranscript && (
            <pre className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-3 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
              {transcript}
            </pre>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded px-3 py-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={saveMeeting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
          >
            <Check size={14} />
            Save Meeting & Actions
          </button>
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            Discard
          </button>
        </div>
      </div>
    );
  }

  // --- Step: SAVING ---
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
      <Loader2 size={24} className="animate-spin text-emerald-500 mx-auto mb-2" />
      <p className="text-sm text-gray-600">Saving meeting and actions...</p>
    </div>
  );
}
