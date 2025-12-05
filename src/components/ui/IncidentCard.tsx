import Link from 'next/link';
import { SeverityChip } from './SeverityChip';
import { StatusChip } from './StatusChip';
import { DataPathBadge } from './DataPathBadge';

interface IncidentCardProps {
  incident: {
    id: string;
    title: string;
    serviceName: string;
    status: string;
    severity: string;
    environment: string;
    dataPathKeys?: string[];
    createdAt: string;
    updatedAt: string;
  };
  orgSlug: string;
  getRelativeTime: (dateStr: string) => string;
  getFlowForKey?: (key: string) => any;
}

export function IncidentCard({ incident, orgSlug, getRelativeTime, getFlowForKey }: IncidentCardProps) {
  const createdAgo = getRelativeTime(incident.createdAt);
  const updatedAgo = getRelativeTime(incident.updatedAt);
  
  // Calculate duration
  const now = new Date();
  const created = new Date(incident.createdAt);
  const durationMs = now.getTime() - created.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const duration = durationHours > 0 ? `${durationHours}h ${durationMins}m` : `${durationMins}m`;
  
  return (
    <Link
      href={`/orgs/${orgSlug}/incidents/${incident.id}`}
      className="group mb-3 block"
    >
      <div className="rounded-2xl border border-zinc-800/80 bg-[#060814] px-4 py-3 flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 hover:border-orange-500/60 hover:bg-[#090d1b] hover:shadow-[0_0_25px_rgba(248,113,113,0.18)] hover:scale-[1.01]">
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide">
            <SeverityChip severity={incident.severity} />
            <StatusChip status={incident.status} />
            <span className="text-zinc-400">{incident.serviceName}</span>
            <span className="text-zinc-500">· {incident.environment}</span>
          </div>
          
          <h2 className="text-sm font-medium text-zinc-100 mb-1 group-hover:text-orange-300 transition-colors">
            {incident.title}
          </h2>
          
          {incident.dataPathKeys && incident.dataPathKeys.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 mb-1">
              {incident.dataPathKeys.slice(0, 3).map((key) => (
                <DataPathBadge
                  key={key}
                  flow={getFlowForKey?.(key)}
                  dataPathKey={key}
                  className="text-[10px]"
                />
              ))}
              {incident.dataPathKeys.length > 3 && (
                <span className="text-[10px] text-zinc-500">
                  +{incident.dataPathKeys.length - 3} more paths
                </span>
              )}
            </div>
          )}
          
          <p className="text-[11px] text-zinc-500">
            Created {createdAgo} · Updated {updatedAgo}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right text-[10px] text-zinc-500">
            <p className="font-medium text-zinc-400">{duration}</p>
            <p>duration</p>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-orange-500/20">
            →
          </div>
        </div>
      </div>
    </Link>
  );
}
