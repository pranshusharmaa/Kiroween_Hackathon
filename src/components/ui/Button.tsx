import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  className?: string;
}

export function PrimaryButton({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-60 bg-orange-500 hover:bg-orange-400 text-black ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-60 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
