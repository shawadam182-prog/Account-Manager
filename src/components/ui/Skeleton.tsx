import React, { useEffect, useRef } from 'react';

/* ------------------------------------------------------------------ */
/*  Shimmer style injection (once per document)                        */
/* ------------------------------------------------------------------ */

const STYLE_ID = 'skeleton-shimmer-keyframes';

function useShimmerStyle() {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    if (document.getElementById(STYLE_ID)) {
      injected.current = true;
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes skeleton-shimmer {
        0%   { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
    `;
    document.head.appendChild(style);
    injected.current = true;
  }, []);
}

/* ------------------------------------------------------------------ */
/*  Base Skeleton                                                      */
/* ------------------------------------------------------------------ */

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '4px',
  style,
}: SkeletonProps) {
  useShimmerStyle();

  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background:
          'linear-gradient(90deg, #E8E3DB 25%, #F5F3EE 50%, #E8E3DB 75%)',
        backgroundSize: '800px 100%',
        animation: 'skeleton-shimmer 1.6s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonCard — mimics a stat card                                  */
/* ------------------------------------------------------------------ */

export function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E3DB',
        borderRadius: '10px',
        padding: '20px',
      }}
    >
      {/* Label line */}
      <Skeleton width="40%" height="12px" style={{ marginBottom: '12px' }} />

      {/* Large value line */}
      <Skeleton width="60%" height="28px" style={{ marginBottom: '14px' }} />

      {/* Sub-text line */}
      <Skeleton width="50%" height="12px" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonTable — mimics a table with rows                           */
/* ------------------------------------------------------------------ */

interface SkeletonTableProps {
  rows?: number;
}

export function SkeletonTable({ rows = 5 }: SkeletonTableProps) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E3DB',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '14px 20px',
          borderBottom: '1px solid #E8E3DB',
          backgroundColor: '#F5F3EE',
        }}
      >
        <Skeleton width="20%" height="12px" />
        <Skeleton width="15%" height="12px" />
        <Skeleton width="25%" height="12px" />
        <Skeleton width="15%" height="12px" />
        <Skeleton width="10%" height="12px" />
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '16px',
            padding: '14px 20px',
            borderBottom: i < rows - 1 ? '1px solid #E8E3DB' : 'none',
          }}
        >
          <Skeleton width="20%" height="14px" />
          <Skeleton width="15%" height="14px" />
          <Skeleton width="25%" height="14px" />
          <Skeleton width="15%" height="14px" />
          <Skeleton width="10%" height="14px" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
