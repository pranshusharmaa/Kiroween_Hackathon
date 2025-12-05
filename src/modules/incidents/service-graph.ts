import { prisma } from '@/lib/db/client';

/**
 * Service Graph Types
 */

export interface ServiceGraphNode {
  id: string; // serviceName-environment
  serviceName: string;
  environment: string;
  totalEvents: number;
  errorEvents: number;
  errorRatio: number; // 0-1
}

export interface ServiceGraphEdge {
  id: string; // from-to
  from: string; // node id
  to: string; // node id
  count: number; // total calls
  errorCount: number; // failed calls
}

export interface ServiceGraph {
  nodes: ServiceGraphNode[];
  edges: ServiceGraphEdge[];
  metadata: {
    totalTraces: number;
    totalEvents: number;
    errorRate: number;
  };
}

/**
 * Build a service graph for an incident by analyzing signals and events
 */
export async function buildServiceGraphForIncident(
  orgId: string,
  incidentId: string
): Promise<ServiceGraph> {
  // Get incident details
  const incident = await prisma.incidentSnapshot.findFirst({
    where: { id: incidentId, orgId },
    select: {
      dataPathKeys: true,
      correlationKeys: true,
    },
  });

  if (!incident) {
    throw new Error('Incident not found');
  }

  // Get all signals for this incident
  const signals = await prisma.incidentSignal.findMany({
    where: {
      incidentId,
      orgId,
    },
    select: {
      id: true,
      serviceName: true,
      environment: true,
      signalType: true,
      correlationKey: true,
      traceId: true,
      data: true,
      ts: true,
    },
    orderBy: {
      ts: 'asc',
    },
  });

  // Convert signals to events
  const allEvents = signals.map((s: any) => ({
    id: s.id,
    serviceName: s.serviceName,
    environment: s.environment,
    isError: s.signalType.includes('ERROR') || s.signalType.includes('ALERT') || s.signalType.includes('CRITICAL'),
    correlationKey: s.correlationKey || null,
    traceId: s.traceId || null,
    timestamp: s.ts,
    data: s.data,
  }));

  // Sort by timestamp
  allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Group events by trace/correlation key
  const traceGroups = new Map<string, typeof allEvents>();
  
  for (const event of allEvents) {
    const key = event.traceId || event.correlationKey || `single-${event.id}`;
    if (!traceGroups.has(key)) {
      traceGroups.set(key, []);
    }
    traceGroups.get(key)!.push(event);
  }

  // Build nodes and edges
  const nodeMap = new Map<string, ServiceGraphNode>();
  const edgeMap = new Map<string, ServiceGraphEdge>();

  // Process each trace group
  for (const [traceKey, events] of traceGroups.entries()) {
    // Build nodes from events
    for (const event of events) {
      const nodeId = `${event.serviceName}-${event.environment}`;
      
      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, {
          id: nodeId,
          serviceName: event.serviceName,
          environment: event.environment,
          totalEvents: 0,
          errorEvents: 0,
          errorRatio: 0,
        });
      }

      const node = nodeMap.get(nodeId)!;
      node.totalEvents++;
      if (event.isError) {
        node.errorEvents++;
      }
    }

    // Build edges from sequential events in the same trace
    for (let i = 0; i < events.length - 1; i++) {
      const fromEvent = events[i];
      const toEvent = events[i + 1];

      const fromNodeId = `${fromEvent.serviceName}-${fromEvent.environment}`;
      const toNodeId = `${toEvent.serviceName}-${toEvent.environment}`;

      // Skip self-loops for now (could be added later)
      if (fromNodeId === toNodeId) continue;

      const edgeId = `${fromNodeId}->${toNodeId}`;

      if (!edgeMap.has(edgeId)) {
        edgeMap.set(edgeId, {
          id: edgeId,
          from: fromNodeId,
          to: toNodeId,
          count: 0,
          errorCount: 0,
        });
      }

      const edge = edgeMap.get(edgeId)!;
      edge.count++;
      if (toEvent.isError) {
        edge.errorCount++;
      }
    }
  }

  // Calculate error ratios for nodes
  for (const node of nodeMap.values()) {
    node.errorRatio = node.totalEvents > 0 ? node.errorEvents / node.totalEvents : 0;
  }

  // Convert maps to arrays
  const nodes = Array.from(nodeMap.values());
  const edges = Array.from(edgeMap.values());

  // Calculate metadata
  const totalEvents = allEvents.length;
  const errorEvents = allEvents.filter((e) => e.isError).length;
  const errorRate = totalEvents > 0 ? errorEvents / totalEvents : 0;

  return {
    nodes,
    edges,
    metadata: {
      totalTraces: traceGroups.size,
      totalEvents,
      errorRate,
    },
  };
}

/**
 * Get top error-producing services from the graph
 */
export function getTopErrorServices(graph: ServiceGraph, limit: number = 5): ServiceGraphNode[] {
  return graph.nodes
    .filter((node) => node.errorEvents > 0)
    .sort((a, b) => {
      // Sort by error ratio first, then by total error count
      if (b.errorRatio !== a.errorRatio) {
        return b.errorRatio - a.errorRatio;
      }
      return b.errorEvents - a.errorEvents;
    })
    .slice(0, limit);
}

/**
 * Get critical paths (edges with high error rates)
 */
export function getCriticalPaths(graph: ServiceGraph, limit: number = 5): ServiceGraphEdge[] {
  return graph.edges
    .filter((edge) => edge.errorCount > 0)
    .sort((a, b) => {
      const aRatio = a.errorCount / a.count;
      const bRatio = b.errorCount / b.count;
      if (bRatio !== aRatio) {
        return bRatio - aRatio;
      }
      return b.errorCount - a.errorCount;
    })
    .slice(0, limit);
}
