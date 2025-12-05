interface DataPathBadgeProps {
  flow?: {
    route?: string;
    method?: string;
    businessType?: string;
    businessKey?: string;
    dataPathKey: string;
  };
  dataPathKey?: string;
  className?: string;
}

export function DataPathBadge({ flow, dataPathKey, className = '' }: DataPathBadgeProps) {
  // Build a readable label
  let label = '';
  
  if (flow) {
    const parts: string[] = [];
    
    if (flow.method) {
      parts.push(flow.method);
    }
    
    if (flow.route) {
      parts.push(flow.route);
    }
    
    if (flow.businessType && flow.businessKey) {
      parts.push(`${flow.businessType}=${flow.businessKey}`);
    }
    
    label = parts.length > 0 ? parts.join(' · ') : `Path #${flow.dataPathKey.substring(0, 8)}`;
  } else if (dataPathKey) {
    label = `Path #${dataPathKey.substring(0, 8)}`;
  } else {
    label = 'Unknown path';
  }
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-purple-500/10 text-purple-200 border border-purple-500/40 ${className}`}
      title={flow?.dataPathKey || dataPathKey}
    >
      {label}
    </span>
  );
}
