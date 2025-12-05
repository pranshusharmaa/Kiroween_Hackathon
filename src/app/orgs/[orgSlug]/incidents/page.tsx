'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { SeverityChip } from '@/components/ui/SeverityChip';
import { DataPathBadge } from '@/components/ui/DataPathBadge';
import { StatCard } from '@/components/ui/MiniChart';
import { IncidentCard } from '@/components/ui/IncidentCard';
import { ListLoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { Tooltip } from '@/components/ui/Tooltip';

interface Incident {
  id: string;
  title: string;
  serviceName: string;
  status: string;
  severity: string;
  environment: string;
  dataPathKeys?: string[];
  createdAt: string;
  updatedAt: string;
}

interface WatchlistEntry {
  id: string;
  serviceName: string;
  environment: string;
  status: string;
  riskScore: number;
  source: string;
  dataPathKey?: string;
  logsSnapshot: Array<{
    level: string;
    message: string;
    timestamp: string;
  }>;
  lastUpdatedAt: string;
}

interface DataPathFlow {
  id: string;
  dataPathKey: string;
  route?: string;
  method?: string;
  businessType?: string;
  businessKey?: string;
  eventCount: number;
  lastSeenAt: string;
}

export default function IncidentsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [watchlistEntries, setWatchlistEntries] = useState<WatchlistEntry[]>([]);
  const [dataPathFlows, setDataPathFlows] = useState<DataPathFlow[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  
  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity'>('newest');

  useEffect(() => {
    async function fetchData() {
      try {
        // Get org ID from slug
        const orgsRes = await fetch('/api/orgs');
        const orgsData = await orgsRes.json();
        const org = orgsData.orgs?.find((o: any) => o.slug === orgSlug);

        if (!org) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        setOrgId(org.id);

        // Fetch incidents, watchlist, and dashboard
        const [incidentsRes, watchlistRes, dashboardRes] = await Promise.all([
          fetch(`/api/orgs/${org.id}/incidents`),
          fetch(`/api/orgs/${org.id}/watchlist`),
          fetch(`/api/orgs/${org.id}/dashboard`),
        ]);
        
        const incidentsData = await incidentsRes.json();
        const watchlistData = await watchlistRes.json();
        const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null;

        const allIncidents = incidentsData.incidents || [];
        setIncidents(allIncidents);
        setFilteredIncidents(allIncidents);
        setWatchlistEntries(watchlistData.entries || []);
        setDashboard(dashboardData);

        // Fetch data paths separately (optional, don't fail if it errors)
        try {
          const dataPathsRes = await fetch(`/api/orgs/${org.id}/data-paths?limit=20`);
          if (dataPathsRes.ok) {
            const dataPathsData = await dataPathsRes.json();
            setDataPathFlows(dataPathsData.flows || []);
          }
        } catch (err) {
          console.warn('Failed to load data paths:', err);
          // Continue without data paths
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    }

    fetchData();
  }, [orgSlug]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...incidents];

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(inc => statusFilter.includes(inc.status));
    }

    // Apply severity filter
    if (severityFilter.length > 0) {
      filtered = filtered.filter(inc => severityFilter.includes(inc.severity));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'severity':
          const severityOrder: Record<string, number> = { SEV1: 0, SEV2: 1, SEV3: 2, SEV4: 3 };
          return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
        default:
          return 0;
      }
    });

    setFilteredIncidents(filtered);
  }, [incidents, statusFilter, severityFilter, sortBy]);

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleSeverityFilter = (severity: string) => {
    setSeverityFilter(prev =>
      prev.includes(severity) ? prev.filter(s => s !== severity) : [...prev, severity]
    );
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return `${diffMins}m ago`;
  };

  const clearWatchlistEntry = async (entryId: string) => {
    if (!orgId) return;

    try {
      await fetch(`/api/orgs/${orgId}/watchlist/${entryId}/clear`, {
        method: 'POST',
      });
      
      const watchlistRes = await fetch(`/api/orgs/${orgId}/watchlist`);
      const watchlistData = await watchlistRes.json();
      setWatchlistEntries(watchlistData.entries || []);
    } catch (err) {
      console.error('Failed to clear watchlist entry:', err);
    }
  };

  const getFlowForKey = (dataPathKey: string) => {
    return dataPathFlows.find(f => f.dataPathKey === dataPathKey);
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="rounded-2xl bg-[#0b0f1a]/90 border border-white/10 p-4 h-24" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <ListLoadingSkeleton />
          </Card>
          <div className="space-y-4">
            <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-24 rounded bg-zinc-800/70" />
                <div className="space-y-2">
                  <div className="h-12 w-full rounded bg-zinc-900/70" />
                  <div className="h-12 w-full rounded bg-zinc-900/70" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Open Incidents"
            value={dashboard.overview.openIncidents}
            change={`${dashboard.overview.incidents24h} in 24h`}
            trend={dashboard.overview.incidents24h > 0 ? 'up' : 'neutral'}
            chart={dashboard.trends.incidentTrend}
            chartColor="orange"
          />
          <StatCard
            title="Critical"
            value={dashboard.overview.criticalIncidents}
            trend={dashboard.overview.criticalIncidents > 0 ? 'up' : 'down'}
            chart={dashboard.trends.incidentTrend.map((v: number) => v * 0.3)}
            chartColor="red"
          />
          <StatCard
            title="MTTR"
            value={`${dashboard.overview.avgMTTR}h`}
            change="avg resolution"
            trend="neutral"
            chartColor="blue"
          />
          <StatCard
            title="Data Paths"
            value={dashboard.dataPaths.totalFlows}
            change={`${dashboard.dataPaths.totalEvents} events`}
            trend="neutral"
            chartColor="emerald"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* Left Column - Incidents List */}
        <div className="space-y-4">
          <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
          <div className="mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Incidents
                  </h2>
                  {incidents.length > 0 && <LiveIndicator size="sm" />}
                </div>
                <p className="text-sm text-zinc-300">
                  {filteredIncidents.length} of {incidents.length} incidents
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200 hover:bg-white/10"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="severity">By Severity</option>
                </select>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-zinc-500">Filter:</span>
              {['OPEN', 'INVESTIGATING', 'RESOLVED'].map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={`text-xs px-2 py-1 rounded-full transition-all ${
                    statusFilter.includes(status)
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {status}
                </button>
              ))}
              <span className="text-zinc-600">|</span>
              {['SEV1', 'SEV2', 'SEV3'].map((severity) => (
                <button
                  key={severity}
                  onClick={() => toggleSeverityFilter(severity)}
                  className={`text-xs px-2 py-1 rounded-full transition-all ${
                    severityFilter.includes(severity)
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {severity}
                </button>
              ))}
              {(statusFilter.length > 0 || severityFilter.length > 0) && (
                <button
                  onClick={() => {
                    setStatusFilter([]);
                    setSeverityFilter([]);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {filteredIncidents.length === 0 ? (
            <EmptyState
              title="No incidents found"
              description="Try adjusting your filters or check back later."
              icon="🔍"
            />
          ) : (
            <div className="space-y-0">
              {filteredIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  orgSlug={orgSlug}
                  getRelativeTime={getRelativeTime}
                  getFlowForKey={getFlowForKey}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Right Column - Watchlist & Data Paths */}
      <div className="space-y-4">
        {/* Watchlist */}
        <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🎃</span>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Watchlist</h2>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            SLA risk monitoring
          </p>

          {watchlistEntries.length === 0 ? (
            <EmptyState
              title="All systems healthy"
              description="No SLA risks detected at this time."
              icon="👻"
            />
          ) : (
            <div className="space-y-2">
              {watchlistEntries.slice(0, 5).map((entry) => {
                const flow = entry.dataPathKey ? getFlowForKey(entry.dataPathKey) : undefined;
                
                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:bg-white/10 hover:border-orange-500/40"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
                            entry.status === 'BREACHED'
                              ? 'bg-red-500/15 text-red-300 border-red-500/40 animate-pulse-slow'
                              : entry.status === 'AT_RISK'
                              ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {entry.status}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            entry.riskScore >= 0.8
                              ? 'text-red-400'
                              : entry.riskScore >= 0.5
                              ? 'text-orange-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {Math.round(entry.riskScore * 100)}%
                        </span>
                      </div>
                      <Tooltip content="Clear entry">
                        <button
                          onClick={() => clearWatchlistEntry(entry.id)}
                          className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                        >
                          ✕
                        </button>
                      </Tooltip>
                    </div>
                    
                    <div className="text-xs text-zinc-300 mb-1">
                      {entry.serviceName} · {entry.environment}
                    </div>
                    
                    {flow && (
                      <div className="mb-2">
                        <DataPathBadge flow={flow} />
                      </div>
                    )}
                    
                    <div className="text-xs text-zinc-500 mb-2">
                      {entry.source}
                    </div>
                    
                    {entry.logsSnapshot && entry.logsSnapshot.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-black/40 text-xs">
                        <div className="text-zinc-500 mb-1">Latest:</div>
                        <div className="text-zinc-400 font-mono text-[10px] line-clamp-2">
                          {entry.logsSnapshot[0]?.message}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Data Path Overview */}
        {dataPathFlows.length > 0 && (
          <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
              Active Data Paths
            </h2>
            <div className="space-y-2">
              {dataPathFlows.slice(0, 5).map((flow) => (
                <div
                  key={flow.id}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:bg-white/10 hover:border-purple-500/40"
                >
                  <DataPathBadge flow={flow} className="mb-1" />
                  <div className="text-xs text-zinc-500 mt-1">
                    {flow.eventCount} events · {getRelativeTime(flow.lastSeenAt)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
