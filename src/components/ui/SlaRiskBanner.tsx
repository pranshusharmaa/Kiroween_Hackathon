interface SlaRiskBannerProps {
  serviceName: string;
  environment: string;
  riskScore: number;
  status: string;
}

export function SlaRiskBanner({ serviceName, environment, riskScore, status }: SlaRiskBannerProps) {
  const riskPct = Math.round(riskScore * 100);
  
  return (
    <div className="mb-4 rounded-2xl border border-orange-500/60 bg-gradient-to-r from-orange-950/80 via-orange-900/50 to-transparent px-5 py-3 flex items-center justify-between gap-4 shadow-[0_0_40px_rgba(248,113,113,0.25)] transition-all duration-200 hover:shadow-[0_0_50px_rgba(248,113,113,0.35)] animate-pulse-slow">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-orange-300 animate-pulse">
          ⚠️
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-orange-300 uppercase">
            SLA Risk Detected
          </p>
          <p className="text-sm text-zinc-100">
            <span className="font-medium">{serviceName}</span>
            <span className="text-zinc-400"> · {environment}</span>
            <span className="text-zinc-500"> · Risk score {riskPct}%</span>
          </p>
        </div>
      </div>
      <div className="w-40">
        <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
          <span>Stable</span>
          <span>Critical</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-900/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-300"
            style={{ width: `${Math.min(riskPct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
