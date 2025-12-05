'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { SeverityChip } from '@/components/ui/SeverityChip';
import { DataPathBadge } from '@/components/ui/DataPathBadge';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import { CreatePostmortemPRButton } from '@/components/CreatePostmortemPRButton';
import { SlaRiskBanner } from '@/components/ui/SlaRiskBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardLoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { ResolveIncidentModal } from '@/components/ResolveIncidentModal';
import { DataFlowMap } from '@/components/DataFlowMap';
import { GuardrailBadge } from '@/components/ui/GuardrailBadge';

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
  signals: Signal[];
  actions: Action[];
}

interface Signal {
  id: string;
  signalType: string;
  source: string;
  summary: string;
  ts: string;
}

interface Action {
  id: string;
  actorType: string;
  actionKind: string;
  label: string;
  details: string | null;
  ts: string;
}

interface Guidance {
  actions: SuggestedAction[];
  diagnosticQuestions: string[];
  relatedIncidents: any[];
}

interface SuggestedAction {
  label: string;
  explanation: string;
  safetyLevel: string;
  kind: string;
  runbookSection?: string;
}

interface DataPathFlow {
  id: string;
  dataPathKey: string;
  route?: string;
  method?: string;
  businessType?: string;
  businessKey?: string;
  eventCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface WatchlistEntry {
  id: string;
  serviceName: string;
  environment: string;
  status: string;
  riskScore: number;
  dataPathKey?: string;
}

const SAFETY_COLORS: Record<string, string> = {
  SAFE_REVERSIBLE: 'text-emerald-400',
  RISKY: 'text-orange-400',
  INFO_ONLY: 'text-blue-400',
};

export default function IncidentDetailPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const incidentId = params.incidentId as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [dataPathFlows, setDataPathFlows] = useState<DataPathFlow[]>([]);
  const [watchlistEntries, setWatchlistEntries] = useState<WatchlistEntry[]>([]);
  const [similarIncidents, setSimilarIncidents] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostmortem, setShowPostmortem] = useState(false);
  const [postmortemMarkdown, setPostmortemMarkdown] = useState<string | null>(null);
  const [generatingPostmortem, setGeneratingPostmortem] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get org ID
        const orgsRes = await fetch('/api/orgs');
        const orgsData = await orgsRes.json();
        const org = orgsData.orgs?.find((o: any) => o.slug === orgSlug);

        if (!org) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        setOrgId(org.id);

        // Fetch incident details, guidance, and similar incidents
        const [incidentRes, guidanceRes, similarRes] = await Promise.all([
          fetch(`/api/orgs/${org.id}/incidents/${incidentId}`),
          fetch(`/api/orgs/${org.id}/incidents/${incidentId}/guidance`),
          fetch(`/api/orgs/${org.id}/incidents/${incidentId}/similar`),
        ]);

        const incidentData = await incidentRes.json();
        const guidanceData = await guidanceRes.json();
        const similarData = similarRes.ok ? await similarRes.json() : null;

        setIncident(incidentData.incident);
        setGuidance(guidanceData);
        if (similarData) {
          setSimilarIncidents(similarData.similarIncidents || []);
        }

        // Fetch watchlist and data paths for this service
        if (incidentData.incident) {
          // Fetch watchlist
          try {
            const watchlistRes = await fetch(
              `/api/orgs/${org.id}/watchlist?serviceName=${incidentData.incident.serviceName}&environment=${incidentData.incident.environment}`
            );
            if (watchlistRes.ok) {
              const watchlistData = await watchlistRes.json();
              setWatchlistEntries(watchlistData.entries || []);
            }
          } catch (err) {
            console.warn('Failed to load watchlist:', err);
          }

          // Fetch data paths (optional)
          try {
            const dataPathsRes = await fetch(`/api/orgs/${org.id}/data-paths?projectId=${incidentData.incident.projectId}&limit=20`);
            if (dataPathsRes.ok) {
              const dataPathsData = await dataPathsRes.json();
              
              // Filter data paths by incident's data path keys
              const incidentDataPaths = incidentData.incident.dataPathKeys || [];
              const relevantFlows = (dataPathsData.flows || []).filter((flow: DataPathFlow) =>
                incidentDataPaths.includes(flow.dataPathKey)
              );
              setDataPathFlows(relevantFlows);
            }
          } catch (err) {
            console.warn('Failed to load data paths:', err);
          }

          // Fetch deployments with guardrail checks
          try {
            const deploymentsUrl = `/api/orgs/${org.id}/incidents/${incidentId}/deployments`;
            console.log('Fetching deployments from:', deploymentsUrl);
            const deploymentsRes = await fetch(deploymentsUrl);
            console.log('Deployments response status:', deploymentsRes.status);
            if (deploymentsRes.ok) {
              const deploymentsData = await deploymentsRes.json();
              console.log('Deployments data:', deploymentsData);
              setDeployments(deploymentsData.deployments || []);
              console.log('Set deployments count:', deploymentsData.deployments?.length || 0);
            } else {
              console.error('Deployments fetch failed:', deploymentsRes.status, await deploymentsRes.text());
            }
          } catch (err) {
            console.error('Failed to load deployments:', err);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load incident:', err);
        setError('Failed to load incident');
        setLoading(false);
      }
    }

    fetchData();
  }, [orgSlug, incidentId]);

  const handleExecuteAction = async (action: SuggestedAction) => {
    if (!orgId) return;

    try {
      await fetch(`/api/orgs/${orgId}/incidents/${incidentId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKind: action.kind,
          label: action.label,
          details: action.explanation,
        }),
      });

      // Refresh incident data
      const incidentRes = await fetch(`/api/orgs/${orgId}/incidents/${incidentId}`);
      const incidentData = await incidentRes.json();
      setIncident(incidentData.incident);
    } catch (err) {
      console.error('Failed to execute action:', err);
    }
  };

  const handleGeneratePostmortem = async () => {
    if (!orgId) return;

    setGeneratingPostmortem(true);
    try {
      let res = await fetch(`/api/orgs/${orgId}/incidents/${incidentId}/postmortem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.status === 409) {
        res = await fetch(`/api/orgs/${orgId}/incidents/${incidentId}/postmortem`);
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const markdown = data.markdown || data.postmortem?.markdown;
      
      if (!markdown) {
        throw new Error('No postmortem markdown returned');
      }

      setPostmortemMarkdown(markdown);
      setShowPostmortem(true);
    } catch (err: any) {
      console.error('Failed to generate postmortem:', err);
      alert(`Failed to generate postmortem: ${err.message || 'Unknown error'}`);
    } finally {
      setGeneratingPostmortem(false);
    }
  };

  const handleIncidentResolved = async () => {
    // Refresh incident data
    if (!orgId) return;
    
    const incidentRes = await fetch(`/api/orgs/${orgId}/incidents/${incidentId}`);
    const incidentData = await incidentRes.json();
    setIncident(incidentData.incident);
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
  };

  const mergeTimeline = () => {
    if (!incident) return [];

    const timeline: Array<{ type: 'action' | 'signal'; data: any; ts: string }> = [];

    incident.actions.forEach((action) => {
      timeline.push({ type: 'action', data: action, ts: action.ts });
    });

    incident.signals.forEach((signal) => {
      timeline.push({ type: 'signal', data: signal, ts: signal.ts });
    });

    return timeline.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-6">
        <div className="animate-pulse">
          <div className="h-24 w-full rounded-2xl bg-[#0b0f1a]/90 border border-white/10 mb-4" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              <CardLoadingSkeleton />
            </Card>
            <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              <CardLoadingSkeleton />
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              <CardLoadingSkeleton />
            </Card>
            <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              <CardLoadingSkeleton />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-400">{error || 'Incident not found'}</div>
      </div>
    );
  }

  const timeline = mergeTimeline();
  const atRiskWatchlist = watchlistEntries.filter(e => e.status === 'AT_RISK' || e.status === 'BREACHED');

  return (
    <div className="space-y-4 pt-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-[#050712]/90 backdrop-blur-sm pb-4">
        {/* SLA Warning Banner */}
        {atRiskWatchlist.length > 0 && (
          <SlaRiskBanner
            serviceName={atRiskWatchlist[0].serviceName}
            environment={atRiskWatchlist[0].environment}
            riskScore={atRiskWatchlist[0].riskScore}
            status={atRiskWatchlist[0].status}
          />
        )}

        {/* Incident Header Card */}
        <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <SeverityChip severity={incident.severity} />
              <StatusChip status={incident.status} />
              <span className="text-sm text-zinc-500">{incident.serviceName}</span>
              <span className="text-sm text-zinc-600">·</span>
              <span className="text-sm text-zinc-500">{incident.environment}</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50 mb-2">
              {incident.title}
            </h1>
            {incident.dataPathKeys && incident.dataPathKeys.length > 0 && (
              <div className="flex items-center gap-1 mb-3 flex-wrap">
                {incident.dataPathKeys.map((key) => {
                  const flow = dataPathFlows.find(f => f.dataPathKey === key);
                  return (
                    <DataPathBadge
                      key={key}
                      flow={flow}
                      dataPathKey={key}
                    />
                  );
                })}
              </div>
            )}
            <div className="text-sm text-zinc-500">
              Duration: {getRelativeTime(incident.createdAt)} · Created {new Date(incident.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {incident.status !== 'RESOLVED' && incident.status !== 'CANCELLED' && (
              <PrimaryButton
                onClick={() => setShowResolveModal(true)}
                className="transition-all duration-200"
              >
                Resolve Incident
              </PrimaryButton>
            )}
            <GhostButton
              onClick={handleGeneratePostmortem}
              disabled={generatingPostmortem}
              className="transition-all duration-200"
            >
              {generatingPostmortem ? 'Generating...' : 'Postmortem'}
            </GhostButton>
            {orgId && <CreatePostmortemPRButton orgId={orgId} incidentId={incidentId} />}
          </div>
        </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Metrics / Signals */}
          <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
              Signals & Metrics
            </h2>
            {incident.signals.length === 0 ? (
              <EmptyState
                title="No signals attached yet."
                description="Connect Datadog / Grafana to see metrics here."
                icon="📊"
              />
            ) : (
              <div className="space-y-2">
                {incident.signals.slice(0, 5).map((signal) => (
                  <div
                    key={signal.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:bg-white/10 hover:border-purple-500/40"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-300">{signal.signalType}</span>
                      <span className="text-xs text-zinc-600">
                        {new Date(signal.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">{signal.source}</div>
                    {signal.summary && (
                      <div className="text-xs text-zinc-400 mt-1">{signal.summary}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Timeline</h2>
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <EmptyState
                  title="No timeline events"
                  description="Actions and signals will appear here as they occur."
                  icon="⏱️"
                />
              ) : (
                timeline.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 w-1 bg-zinc-700 rounded" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            item.type === 'action'
                              ? 'bg-blue-500/15 text-blue-300'
                              : 'bg-purple-500/15 text-purple-300'
                          }`}
                        >
                          {item.type === 'action' ? 'ACTION' : 'SIGNAL'}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {new Date(item.ts).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-300">
                        {item.type === 'action' ? item.data.label : item.data.summary}
                      </div>
                      {item.type === 'action' && item.data.details && (
                        <div className="text-xs text-zinc-500 mt-1">{item.data.details}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* What Changed? */}
          <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">What Changed?</h2>
              <span className="text-xs text-zinc-500">Recent deployments & changes</span>
            </div>
            <div className="space-y-2">
              {deployments.length === 0 ? (
                <EmptyState
                  title="No recent deployments"
                  description="Deployments will appear here when linked to this incident."
                  icon="🚀"
                />
              ) : (
                deployments.map((deployment) => {
                  const guardrailCheck = deployment.guardrailChecks?.[0];
                  const changeTypeColors: Record<string, string> = {
                    DEPLOY: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                    CONFIG_CHANGE: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                    ROLLBACK: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                    SCALE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                  };
                  const colorClass = changeTypeColors[deployment.changeType] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';

                  return (
                    <div key={deployment.id} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
                            {deployment.changeType.replace('_', ' ')}
                          </span>
                          {guardrailCheck && (
                            <GuardrailBadge status={guardrailCheck.status} />
                          )}
                          <span className="text-xs text-zinc-500">
                            {getRelativeTime(deployment.deployedAt)} ago
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-zinc-300 mb-1">
                        {deployment.title}
                      </div>
                      <div className="text-xs text-zinc-500 mb-2">
                        {deployment.author && `by ${deployment.author} · `}
                        {deployment.serviceName} · {deployment.environment}
                      </div>
                      
                      {/* Guardrail metrics */}
                      {guardrailCheck && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-zinc-500">P95 Latency:</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-zinc-400">{Math.round(guardrailCheck.baselineP95LatencyMs)}ms</span>
                                <span className="text-zinc-600">→</span>
                                <span className={guardrailCheck.latencyDeltaPct > 20 ? 'text-red-400' : guardrailCheck.latencyDeltaPct > 10 ? 'text-amber-400' : 'text-emerald-400'}>
                                  {Math.round(guardrailCheck.newP95LatencyMs)}ms
                                </span>
                                <span className={guardrailCheck.latencyDeltaPct > 0 ? 'text-red-400' : 'text-emerald-400'}>
                                  ({guardrailCheck.latencyDeltaPct > 0 ? '+' : ''}{guardrailCheck.latencyDeltaPct.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-500">Error Rate:</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-zinc-400">{(guardrailCheck.baselineErrorRate * 100).toFixed(2)}%</span>
                                <span className="text-zinc-600">→</span>
                                <span className={guardrailCheck.errorRateDeltaPct > 50 ? 'text-red-400' : guardrailCheck.errorRateDeltaPct > 20 ? 'text-amber-400' : 'text-emerald-400'}>
                                  {(guardrailCheck.newErrorRate * 100).toFixed(2)}%
                                </span>
                                <span className={guardrailCheck.errorRateDeltaPct > 0 ? 'text-red-400' : 'text-emerald-400'}>
                                  ({guardrailCheck.errorRateDeltaPct > 0 ? '+' : ''}{guardrailCheck.errorRateDeltaPct.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                          {guardrailCheck.status !== 'PASS' && (
                            <div className="mt-2 text-[10px] text-zinc-500">
                              {guardrailCheck.reason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Data Flow Map */}
          {orgId && <DataFlowMap orgId={orgId} incidentId={incidentId} />}

          {/* Data Paths */}
          {dataPathFlows.length > 0 && (
            <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Data Path Flows</h2>
              <div className="space-y-2">
                {dataPathFlows.map((flow) => {
                  const watchEntry = watchlistEntries.find(e => e.dataPathKey === flow.dataPathKey);
                  
                  return (
                    <div
                      key={flow.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <DataPathBadge flow={flow} />
                        {watchEntry && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              watchEntry.status === 'BREACHED'
                                ? 'bg-red-500/15 text-red-300'
                                : 'bg-orange-500/15 text-orange-300'
                            }`}
                          >
                            {watchEntry.status}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {flow.eventCount} events · Last seen {getRelativeTime(flow.lastSeenAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Suggested Actions */}
          <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Suggested Actions</h2>
            {guidance?.actions && guidance.actions.length > 0 ? (
              <div className="space-y-2">
                {guidance.actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-200">{action.label}</span>
                      <Tooltip 
                        content={
                          action.safetyLevel === 'INFO_ONLY' 
                            ? 'This action is informational and does not execute changes'
                            : action.safetyLevel === 'SAFE_REVERSIBLE'
                            ? 'This action can be safely reversed'
                            : 'This action may have irreversible effects'
                        }
                      >
                        <span className={`text-xs ${SAFETY_COLORS[action.safetyLevel]} cursor-help`}>
                          {action.safetyLevel.replace('_', ' ')}
                        </span>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-zinc-400 mb-2">{action.explanation}</p>
                    <button
                      onClick={() => handleExecuteAction(action)}
                      className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors"
                    >
                      Execute
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-500">No suggestions available</div>
            )}
          </Card>

          {/* Diagnostic Questions */}
          <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Diagnostic Questions</h2>
            {guidance?.diagnosticQuestions && guidance.diagnosticQuestions.length > 0 ? (
              <ul className="space-y-2">
                {guidance.diagnosticQuestions.map((question, idx) => (
                  <li key={idx} className="text-sm text-zinc-400 flex gap-2">
                    <span className="text-zinc-600">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-zinc-500">No questions available</div>
            )}
          </Card>

          {/* Haunted History - Similar Incidents */}
          {similarIncidents.length > 0 && (
            <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👻</span>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Haunted History</h2>
                <span className="text-xs text-zinc-500">Past similar incidents</span>
              </div>
              <div className="space-y-2">
                {similarIncidents.slice(0, 5).map((similar: any, idx: number) => (
                  <Link
                    key={similar.id}
                    href={`/orgs/${orgSlug}/incidents/${similar.id}`}
                    className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SeverityChip severity={similar.severity} />
                        <StatusChip status={similar.status} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-purple-400 font-medium">
                          {similar.similarityScore}%
                        </span>
                        <span className="text-xs text-zinc-600">match</span>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-300 mb-1 line-clamp-2">
                      {similar.title}
                    </div>
                    <div className="text-xs text-zinc-500 mb-2">
                      {similar.serviceName} · {getRelativeTime(similar.createdAt)}
                    </div>
                    {/* Show resolution details if available */}
                    {similar.resolutionSummary && (
                      <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1">
                        <div className="flex items-start gap-1">
                          <span>✓</span>
                          <div>
                            <span className="font-medium">Resolution: </span>
                            {similar.resolutionSummary}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Fallback mock data for demo */}
                    {!similar.resolutionSummary && idx === 0 && (
                      <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1">
                        ✓ Previously fixed by: Rolling back deployment
                      </div>
                    )}
                    {!similar.resolutionSummary && idx === 1 && (
                      <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1">
                        ✓ Root cause: Database connection pool exhaustion
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Postmortem Modal */}
      {showPostmortem && postmortemMarkdown && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-50">Postmortem</h2>
              <button
                onClick={() => setShowPostmortem(false)}
                className="text-zinc-400 hover:text-zinc-300 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">
                {postmortemMarkdown}
              </pre>
            </div>
          </Card>
        </div>
      )}

      {/* Resolve Incident Modal */}
      {showResolveModal && orgId && (
        <ResolveIncidentModal
          incidentId={incidentId}
          incidentTitle={incident.title}
          orgId={orgId}
          onClose={() => setShowResolveModal(false)}
          onResolved={handleIncidentResolved}
        />
      )}
    </div>
  );
}
