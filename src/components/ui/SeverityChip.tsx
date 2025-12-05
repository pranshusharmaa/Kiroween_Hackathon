interface SeverityChipProps {
  severity: string;
  className?: string;
}

export function SeverityChip({ severity, className = '' }: SeverityChipProps) {
  const normalized = severity.toUpperCase();
  
  let colorClasses = '';
  
  switch (normalized) {
    case 'SEV1':
    case 'CRITICAL':
      colorClasses = 'bg-red-500/15 text-red-300 border-red-500/40';
      break;
    case 'SEV2':
    case 'HIGH':
      colorClasses = 'bg-orange-500/15 text-orange-300 border-orange-500/40';
      break;
    case 'SEV3':
    case 'MEDIUM':
      colorClasses = 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40';
      break;
    case 'SEV4':
    case 'LOW':
      colorClasses = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      break;
    default:
      colorClasses = 'bg-zinc-500/15 text-zinc-400 border-zinc-500/40';
  }
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${colorClasses} ${className}`}
    >
      {severity}
    </span>
  );
}
