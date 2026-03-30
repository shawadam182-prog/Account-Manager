import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#F5F3EE',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FFF1F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '24px',
              }}
            >
              !
            </div>

            <h1
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#111827',
                margin: '0 0 8px',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: '14px',
                color: '#9CA3AF',
                margin: '0 0 20px',
                lineHeight: 1.5,
              }}
            >
              An unexpected error occurred. You can try reloading the page.
            </p>

            {this.state.error && (
              <pre
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8E3DB',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  fontSize: '12px',
                  color: '#111827',
                  textAlign: 'left',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: '0 0 24px',
                  lineHeight: 1.6,
                }}
              >
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#16a34a',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  '#15803D';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  '#16a34a';
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
