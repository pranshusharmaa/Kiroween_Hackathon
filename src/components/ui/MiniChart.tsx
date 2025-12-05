interface MiniChartProps {
  data: number[];
  color?: 'red' | 'orange' | 'emerald' | 'blue';
  className?: string;
}

export function MiniChart({ data, color = 'orange', className = '' }: MiniChartProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const colorClasses = {
    red: 'stroke-red-400',
    orange: 'stroke-orange-400',
    emerald: 'stroke-emerald-400',
    blue: 'stroke-blue-400',
  };

  // Create SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`w-full h-full ${className}`}
    >
      <path
        d={pathData}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        className={colorClasses[color]}
      />
    </svg>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  chart?: number[];
  chartColor?: 'red' | 'orange' | 'emerald' | 'blue';
}

export function StatCard({ title, value, change, trend, chart, chartColor }: StatCardProps) {
  const trendColors = {
    up: 'text-red-400',
    down: 'text-emerald-400',
    neutral: 'text-zinc-500',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className="rounded-2xl bg-[#0b0f1a]/90 border border-white/10 shadow-lg shadow-black/40 backdrop-blur p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-xs text-zinc-500 mb-1">{title}</div>
          <div className="text-2xl font-semibold text-zinc-50">{value}</div>
          {change && trend && (
            <div className={`text-xs mt-1 ${trendColors[trend]}`}>
              {trendIcons[trend]} {change}
            </div>
          )}
        </div>
        {chart && chart.length > 0 && (
          <div className="w-20 h-12">
            <MiniChart data={chart} color={chartColor} />
          </div>
        )}
      </div>
    </div>
  );
}
