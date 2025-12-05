interface StatusChipProps {
  status: string;
  className?: string;
}

export function StatusChip({ status, className = '' }: StatusChipProps) {
  const normalized = status.toUpperCase();
  
  let colorClasses = '';
  
  switch (normalized) {
    case 'OPEN':
    case 'INVESTIGATING':
      colorClasses = 'bg-red-500/15 text-red-300 border-red-500/40';
      break;
    case 'MITIGATED':
      colorClasses = 'bg-orange-500/15 text-orange-300 border-orange-500/40';
      break;
    case 'RESOLVED':
    case 'CLOSED':
      colorClasses = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      break;
    case 'CANCELLED':
      colorClasses = 'bg-zinc-500/15 text-zinc-400 border-zinc-500/40';
      break;
    default:
      colorClasses = 'bg-zinc-500/15 text-zinc-400 border-zinc-500/40';
  }
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${colorClasses} ${className}`}
    >
      {status}
    </span>
  );
}
