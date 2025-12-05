interface GuardrailBadgeProps {
  status: 'PASS' | 'WARN' | 'FAIL';
  className?: string;
}

export function GuardrailBadge({ status, className = '' }: GuardrailBadgeProps) {
  const styles = {
    PASS: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300',
      icon: '✓',
    },
    WARN: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/40',
      text: 'text-amber-300',
      icon: '⚠',
    },
    FAIL: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/40',
      text: 'text-red-300',
      icon: '✗',
    },
  };

  const style = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.border} ${style.text} ${className}`}
    >
      <span>{style.icon}</span>
      <span>{status}</span>
    </span>
  );
}
