'use client';

import { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { CardLoadingSkeleton } from './ui/LoadingSkeleton';

interface ServiceGraphNode {
  id: string;
  serviceName: string;
  environment: string;
  totalEvents: number;
  errorEvents: number;
  errorRatio: number;
}

interface ServiceGraphEdge {
  id: string;
  from: string;
  to: string;
  count: number;
  errorCount: number;
}

interface ServiceGraph {
  nodes: ServiceGraphNode[];
  edges: ServiceGraphEdge[];
  metadata: {
    totalTraces: number;
    totalEvents: number;
    errorRate: number;
  };
}

interface DataFlowMapProps {
  orgId: string;
  incidentId: string;
}

export function DataFlowMap({ orgId, incidentId }: DataFlowMapProps) {
  const [graph, setGraph] = useState<ServiceGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGraph() {
      try {
        const res = await fetch(`/api/orgs/${orgId}/incidents/${incidentId}/service-graph`);
        
        if (!res.ok) {
          throw new Error('Failed to load service graph');
        }

        const data = await res.json();
        setGraph(data.graph);
      } catch (err: any) {
        console.error('Failed to load service graph:', err);
        setError(err.message || 'Failed to load data flow map');
      } finally {
        setLoading(false);
      }
    }

    fetchGraph();
  }, [orgId, incidentId]);

  if (loading) {
    return (
      <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
        <CardLoadingSkeleton />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
          Data Flow Map
        </h2>
        <div className="text-sm text-red-400">{error}</div>
      </Card>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
          Data Flow Map
        </h2>
        <EmptyState
          title="No service data available"
          description="Service flow data will appear here when traces are available."
          icon="🗺️"
        />
      </Card>
    );
  }

  // Determine if a node is "hot" (high error ratio)
  const isHotNode = (node: ServiceGraphNode) => {
    return node.errorRatio > 0.3 && node.errorEvents > 2;
  };

  // Get node by id
  const getNode = (nodeId: string) => {
    return graph.nodes.find((n) => n.id === nodeId);
  };

  return (
    <Card className="rounded-2xl bg-[#050b18] border border-zinc-800/60 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-200">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Data Flow Map
        </h2>
        <span className="text-xs text-zinc-500">
          {graph.metadata.totalTraces} trace{graph.metadata.totalTraces !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Service Nodes */}
      <div className="mb-4">
        <div className="text-xs text-zinc-500 mb-2">Services</div>
        <div className="flex flex-wrap gap-2">
          {graph.nodes.map((node) => {
            const hot = isHotNode(node);
            return (
              <div
                key={node.id}
                className={`relative px-3 py-2 rounded-full border transition-all duration-200 ${
                  hot
                    ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse-slow'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium text-zinc-200">
                    {node.serviceName}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    · {node.environment}
                  </div>
                  {hot && (
                    <div className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">
                      HOT
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5">
                  {node.totalEvents} events
                  {node.errorEvents > 0 && (
                    <span className="text-red-400 ml-1">
                      · {node.errorEvents} errors
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flow Edges */}
      {graph.edges.length > 0 && (
        <div>
          <div className="text-xs text-zinc-500 mb-2">Request Flows</div>
          <div className="space-y-1.5">
            {graph.edges.map((edge) => {
              const fromNode = getNode(edge.from);
              const toNode = getNode(edge.to);
              const errorRatio = edge.count > 0 ? edge.errorCount / edge.count : 0;
              const hasErrors = edge.errorCount > 0;

              return (
                <div
                  key={edge.id}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    hasErrors
                      ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs text-zinc-300 truncate">
                        {fromNode?.serviceName || edge.from}
                      </span>
                      <span className="text-zinc-600">→</span>
                      <span className="text-xs text-zinc-300 truncate">
                        {toNode?.serviceName || edge.to}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-zinc-500">
                        {edge.count} call{edge.count !== 1 ? 's' : ''}
                      </span>
                      {hasErrors && (
                        <span className="text-red-400 font-medium">
                          · {edge.errorCount} error{edge.errorCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata */}
      {graph.metadata.errorRate > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Overall Error Rate</span>
            <span
              className={`font-medium ${
                graph.metadata.errorRate > 0.3
                  ? 'text-red-400'
                  : graph.metadata.errorRate > 0.1
                  ? 'text-orange-400'
                  : 'text-yellow-400'
              }`}
            >
              {Math.round(graph.metadata.errorRate * 100)}%
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
