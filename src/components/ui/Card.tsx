import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-[#0b0f1a]/90 border border-white/10 shadow-lg shadow-black/40 backdrop-blur p-4 md:p-5 ${className}`}
    >
      {children}
    </div>
  );
}
