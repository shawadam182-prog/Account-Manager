import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, CheckSquare } from 'lucide-react';
import type { Account, Action } from '../../lib/types';

interface CommandPaletteProps {
  accounts: Account[];
  actions: Action[];
}

interface SearchResult {
  id: string;
  type: 'account' | 'action';
  primary: string;
  secondary: string;
  path: string;
}

export default function CommandPalette({ accounts, actions }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Register Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opening, reset state when closing
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the DOM is rendered before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Build search results
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return { accounts: [], actions: [] };

    const term = debouncedQuery.toLowerCase().trim();

    const accountResults: SearchResult[] = accounts
      .filter((a) => a.company_name.toLowerCase().includes(term))
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        type: 'account' as const,
        primary: a.company_name,
        secondary: [a.membership_level, a.rag_status ? `RAG: ${a.rag_status}` : null]
          .filter(Boolean)
          .join(' \u00B7 ') || 'Account',
        path: `/accounts/${a.id}`,
      }));

    const actionResults: SearchResult[] = actions
      .filter((a) => {
        const desc = a.description.toLowerCase();
        const accountName = a.account?.company_name?.toLowerCase() || '';
        return desc.includes(term) || accountName.includes(term);
      })
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        type: 'action' as const,
        primary: a.description,
        secondary: [
          a.account?.company_name,
          a.owner,
          a.status,
        ].filter(Boolean).join(' \u00B7 '),
        path: a.account_id ? `/accounts/${a.account_id}` : '/actions',
      }));

    return { accounts: accountResults, actions: actionResults };
  }, [debouncedQuery, accounts, actions]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(
    () => [...results.accounts, ...results.actions],
    [results],
  );

  const totalResults = flatResults.length;
  const hasQuery = debouncedQuery.trim().length > 0;

  // Scroll selected item into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const selected = resultsRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation inside the palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(totalResults, 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + Math.max(totalResults, 1)) % Math.max(totalResults, 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatResults[selectedIndex];
        if (item) {
          navigate(item.path);
          setIsOpen(false);
        }
        return;
      }
    },
    [totalResults, flatResults, selectedIndex, navigate],
  );

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      navigate(result.path);
      setIsOpen(false);
    },
    [navigate],
  );

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  }, []);

  if (!isOpen) return null;

  // Track the flat index offset for action results
  const accountCount = results.accounts.length;

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '120px',
        background: 'rgba(0, 0, 0, 0.45)',
        animation: 'commandPaletteFadeIn 0.15s ease-out',
      }}
    >
      {/* Inject keyframes for fade-in animation */}
      <style>{`
        @keyframes commandPaletteFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes commandPaletteSlideIn {
          from { opacity: 0; transform: scale(0.98) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          animation: 'commandPaletteSlideIn 0.15s ease-out',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '4px 16px',
            borderBottom: '1px solid #E8E3DB',
          }}
        >
          <Search size={18} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts, actions..."
            style={{
              flex: 1,
              fontSize: '16px',
              fontFamily: 'inherit',
              color: '#111827',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              padding: '16px 0',
              lineHeight: 1.4,
            }}
          />
          <kbd
            style={{
              fontSize: '11px',
              fontFamily: 'inherit',
              color: '#9CA3AF',
              background: '#F5F3EE',
              border: '1px solid #E8E3DB',
              borderRadius: '4px',
              padding: '2px 6px',
              flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <div
          ref={resultsRef}
          style={{
            maxHeight: '360px',
            overflowY: 'auto',
          }}
        >
          {/* Empty state: no query yet */}
          {!hasQuery && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#9CA3AF',
                fontSize: '13px',
              }}
            >
              Search accounts, actions...
            </div>
          )}

          {/* No results state */}
          {hasQuery && totalResults === 0 && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#9CA3AF',
                fontSize: '13px',
              }}
            >
              No results for "{debouncedQuery}"
            </div>
          )}

          {/* Account results */}
          {results.accounts.length > 0 && (
            <div>
              <div
                style={{
                  padding: '8px 16px 4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Accounts
              </div>
              {results.accounts.map((result, i) => {
                const flatIndex = i;
                const isSelected = selectedIndex === flatIndex;
                return (
                  <div
                    key={result.id}
                    data-selected={isSelected}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      background: isSelected ? '#F5F0E8' : 'transparent',
                      borderBottom: '1px solid #F0EBE3',
                      transition: 'background 0.08s ease',
                    }}
                  >
                    <Building2
                      size={16}
                      style={{ color: '#9CA3AF', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#111827',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {result.primary}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#9CA3AF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {result.secondary}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action results */}
          {results.actions.length > 0 && (
            <div>
              <div
                style={{
                  padding: '8px 16px 4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Actions
              </div>
              {results.actions.map((result, i) => {
                const flatIndex = accountCount + i;
                const isSelected = selectedIndex === flatIndex;
                return (
                  <div
                    key={result.id}
                    data-selected={isSelected}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      background: isSelected ? '#F5F0E8' : 'transparent',
                      borderBottom: '1px solid #F0EBE3',
                      transition: 'background 0.08s ease',
                    }}
                  >
                    <CheckSquare
                      size={16}
                      style={{ color: '#9CA3AF', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#111827',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {result.primary}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#9CA3AF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {result.secondary}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {totalResults > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '8px 16px',
              borderTop: '1px solid #E8E3DB',
              fontSize: '11px',
              color: '#9CA3AF',
            }}
          >
            <span>
              <kbd style={kbdStyle}>{'\u2191'}</kbd>
              <kbd style={kbdStyle}>{'\u2193'}</kbd>
              {' '}navigate
            </span>
            <span>
              <kbd style={kbdStyle}>{'\u21B5'}</kbd>
              {' '}open
            </span>
            <span>
              <kbd style={kbdStyle}>esc</kbd>
              {' '}close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '10px',
  fontFamily: 'inherit',
  color: '#9CA3AF',
  background: '#F5F3EE',
  border: '1px solid #E8E3DB',
  borderRadius: '3px',
  padding: '1px 4px',
  marginRight: '2px',
  lineHeight: 1.4,
};
