interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
}

export function EmptyState({ title, description, icon = '📭' }: EmptyStateProps) {
  return (
    <div className="flex h-24 flex-col items-center justify-center text-xs text-zinc-500">
      <span className="text-2xl mb-2 animate-bounce-slow">{icon}</span>
      <span className="font-medium text-zinc-400">{title}</span>
      {description && (
        <span className="mt-1 text-[11px] text-zinc-600 text-center max-w-xs">
          {description}
        </span>
      )}
    </div>
  );
}
