'use client';

import { ReactNode, useState } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={`absolute z-50 px-3 py-1.5 text-xs text-zinc-100 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-fade-in ${positionClasses[position]}`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-zinc-900 border-zinc-700 transform rotate-45 ${
              position === 'top'
                ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b'
                : position === 'bottom'
                ? 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t'
                : position === 'left'
                ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r'
                : 'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l'
            }`}
          />
        </div>
      )}
    </div>
  );
}
