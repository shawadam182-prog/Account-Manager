import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  removing: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

/* ------------------------------------------------------------------ */
/*  Palette per type                                                   */
/* ------------------------------------------------------------------ */

const typeStyles: Record<
  ToastType,
  { backgroundColor: string; color: string; borderColor: string }
> = {
  success: {
    backgroundColor: '#F0FDF4',
    color: '#15803D',
    borderColor: '#BBF7D0',
  },
  error: {
    backgroundColor: '#FFF1F2',
    color: '#DC2626',
    borderColor: '#FECDD3',
  },
  info: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    borderColor: '#BFDBFE',
  },
};

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Single toast component                                             */
/* ------------------------------------------------------------------ */

function ToastEntry({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: (id: number) => void;
}) {
  const palette = typeStyles[item.type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '8px',
        backgroundColor: palette.backgroundColor,
        color: palette.color,
        border: `1px solid ${palette.borderColor}`,
        fontSize: '13px',
        lineHeight: 1.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        minWidth: '260px',
        maxWidth: '360px',
        opacity: item.removing ? 0 : 1,
        transform: item.removing ? 'translateX(20px)' : 'translateX(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: 'auto' as const,
      }}
    >
      <span style={{ flex: 1, wordBreak: 'break-word' }}>{item.message}</span>

      <button
        onClick={() => onClose(item.id)}
        aria-label="Close"
        style={{
          background: 'none',
          border: 'none',
          color: palette.color,
          cursor: 'pointer',
          fontSize: '15px',
          lineHeight: 1,
          padding: '0 2px',
          opacity: 0.6,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '0.6';
        }}
      >
        &times;
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Container that portals into document.body                          */
/* ------------------------------------------------------------------ */

function ToastContainer({
  items,
  onClose,
}: {
  items: ToastItem[];
  onClose: (id: number) => void;
}) {
  if (items.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {items.map((item) => (
        <ToastEntry key={item.id} item={item} onClose={onClose} />
      ))}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  /* Start the fade-out then fully remove after transition */
  const dismiss = useCallback((id: number) => {
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, removing: true } : t)),
    );

    /* Remove from DOM after the 300ms fade finishes */
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  /* Clean up timers on unmount */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = nextId++;
      setItems((prev) => [...prev, { id, message, type, removing: false }]);

      /* Auto-dismiss after 3 s */
      const timer = setTimeout(() => {
        dismiss(id);
        timersRef.current.delete(id);
      }, 3000);

      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const handleClose = useCallback(
    (id: number) => {
      /* Clear auto-dismiss timer if user manually closes */
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
      dismiss(id);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer items={items} onClose={handleClose} />
    </ToastContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
