interface LiveIndicatorProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LiveIndicator({ label = 'LIVE', size = 'sm' }: LiveIndicatorProps) {
  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  const textSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full bg-red-500 animate-pulse`} />
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-red-500 animate-ping opacity-75`} />
      </div>
      <span className={`${textSizeClasses[size]} font-semibold text-red-400 uppercase tracking-wide`}>
        {label}
      </span>
    </div>
  );
}
