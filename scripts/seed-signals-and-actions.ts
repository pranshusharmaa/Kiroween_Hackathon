import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { attachSignal, addIncidentAction } from '../src/modules/incidents/commands';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedSignalsAndActions() {
  console.log('🎃 Seeding signals and actions for incidents...\n');

  // Get demo org
  const org = await prisma.organization.findFirst({
    where: { slug: 'demo-org' },
  });

  if (!org) {
    console.error('❌ Demo org not found');
    return;
  }

  // Get all incidents
  const incidents = await prisma.incidentSnapshot.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`✅ Found ${incidents.length} incidents\n`);

  for (const incident of incidents) {
    console.log(`📊 Adding data to: ${incident.title}`);

    // Generate trace IDs for realistic service flows
    const trace1 = `trace_${Date.now()}_1`;
    const trace2 = `trace_${Date.now()}_2`;
    const trace3 = `trace_${Date.now()}_3`;

    // Define service topology for realistic flows
    const serviceFlow = [
      'api-gateway',
      incident.serviceName, // The main service from incident
      'database-service',
      'cache-service',
      'notification-service',
    ];

    // Create signals that show request flow through multiple services
    const signals = [];

    // Trace 1: Successful flow through all services
    signals.push(
      {
        signalType: 'REQUEST_RECEIVED',
        source: 'Datadog APM',
        summary: `Request received at api-gateway`,
        serviceName: 'api-gateway',
        environment: incident.environment,
        traceId: trace1,
        correlationKey: `corr_${trace1}`,
        data: { endpoint: '/api/checkout', method: 'POST' },
      },
      {
        signalType: 'REQUEST_PROCESSED',
        source: 'Datadog APM',
        summary: `Request processed by ${incident.serviceName}`,
        serviceName: incident.serviceName,
        environment: incident.environment,
        traceId: trace1,
        correlationKey: `corr_${trace1}`,
        data: { duration: '245ms' },
      },
      {
        signalType: 'DATABASE_QUERY',
        source: 'Datadog APM',
        summary: `Database query executed`,
        serviceName: 'database-service',
        environment: incident.environment,
        traceId: trace1,
        correlationKey: `corr_${trace1}`,
        data: { queryTime: '89ms', rows: 15 },
      }
    );

    // Trace 2: Flow with errors in payment service
    signals.push(
      {
        signalType: 'REQUEST_RECEIVED',
        source: 'Datadog APM',
        summary: `Request received at api-gateway`,
        serviceName: 'api-gateway',
        environment: incident.environment,
        traceId: trace2,
        correlationKey: `corr_${trace2}`,
        data: { endpoint: '/api/payment', method: 'POST' },
      },
      {
        signalType: 'ERROR_RATE_SPIKE',
        source: 'Datadog Monitoring',
        summary: `Error rate increased to 5.2% on ${incident.serviceName}`,
        serviceName: incident.serviceName,
        environment: incident.environment,
        traceId: trace2,
        correlationKey: `corr_${trace2}`,
        data: {
          errorRate: 0.052,
          threshold: 0.01,
          duration: '5m',
          affectedEndpoints: ['/api/checkout', '/api/payment'],
        },
      },
      {
        signalType: 'LOG_ERROR',
        source: 'Splunk',
        summary: `Connection timeout to database`,
        serviceName: 'database-service',
        environment: incident.environment,
        traceId: trace2,
        correlationKey: `corr_${trace2}`,
        data: {
          errorCount: 1,
          pattern: 'connection timeout',
          stackTrace: 'at Database.connect (db.js:123)',
        },
      }
    );

    // Trace 3: Flow with cache and notification services
    signals.push(
      {
        signalType: 'REQUEST_RECEIVED',
        source: 'Datadog APM',
        summary: `Request received at api-gateway`,
        serviceName: 'api-gateway',
        environment: incident.environment,
        traceId: trace3,
        correlationKey: `corr_${trace3}`,
        data: { endpoint: '/api/order', method: 'POST' },
      },
      {
        signalType: 'CACHE_MISS',
        source: 'Redis Monitoring',
        summary: `Cache miss in cache-service`,
        serviceName: 'cache-service',
        environment: incident.environment,
        traceId: trace3,
        correlationKey: `corr_${trace3}`,
        data: { key: 'user:12345', ttl: 3600 },
      },
      {
        signalType: 'REQUEST_PROCESSED',
        source: 'Datadog APM',
        summary: `Request processed by ${incident.serviceName}`,
        serviceName: incident.serviceName,
        environment: incident.environment,
        traceId: trace3,
        correlationKey: `corr_${trace3}`,
        data: { duration: '1200ms' },
      },
      {
        signalType: 'ALERT_TRIGGERED',
        source: 'PagerDuty',
        summary: `Notification delivery failed`,
        serviceName: 'notification-service',
        environment: incident.environment,
        traceId: trace3,
        correlationKey: `corr_${trace3}`,
        data: {
          alertName: 'notification_failure',
          severity: 'high',
          failureReason: 'SMTP timeout',
        },
      }
    );

    // Add additional standalone signals (not part of traces)
    signals.push(
      {
        signalType: 'LATENCY_INCREASE',
        source: 'New Relic APM',
        summary: `P95 latency increased to 1200ms (baseline: 300ms)`,
        serviceName: incident.serviceName,
        environment: incident.environment,
        data: {
          p95: 1200,
          p99: 2400,
          baseline: 300,
          increase: '400%',
        },
      },
      {
        signalType: 'METRIC_THRESHOLD',
        source: 'Grafana',
        summary: `CPU usage exceeded 85% threshold`,
        serviceName: incident.serviceName,
        environment: incident.environment,
        data: {
          metric: 'cpu_usage',
          value: 87.5,
          threshold: 85,
          duration: '10m',
        },
      }
    );

    // Add signals with slight time offsets
    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      try {
        await attachSignal(org.id, incident.id, {
          signalType: signal.signalType,
          source: signal.source,
          summary: signal.summary,
          serviceName: signal.serviceName,
          environment: signal.environment,
          traceId: signal.traceId,
          correlationKey: signal.correlationKey,
          data: signal.data,
        });
        console.log(`   ✅ Added signal: ${signal.signalType} (${signal.serviceName})`);
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`   ❌ Failed to add signal:`, err);
      }
    }

    // Add realistic timeline of actions
    const actions = [
      {
        actorType: 'USER',
        actorRef: 'oncall-engineer',
        actionKind: 'INVESTIGATION_STARTED',
        label: 'Acknowledged incident and started investigation',
        details: 'Checking service health dashboard and recent deployments',
      },
      {
        actorType: 'USER',
        actorRef: 'oncall-engineer',
        actionKind: 'NOTE_ADDED',
        label: 'Observed error spike correlates with recent deployment',
        details: 'Deploy #1234 went out 15 minutes before incident started',
      },
      {
        actorType: 'USER',
        actorRef: 'sre-lead',
        actionKind: 'ESCALATION',
        label: 'Escalated to SRE team lead',
        details: 'Impact is growing, need additional support',
      },
      {
        actorType: 'SYSTEM',
        actorRef: 'auto-scaler',
        actionKind: 'MITIGATION_ATTEMPTED',
        label: 'Auto-scaled service from 5 to 10 instances',
        details: 'Triggered by CPU threshold breach',
      },
      {
        actorType: 'USER',
        actorRef: 'sre-lead',
        actionKind: 'RUNBOOK_EXECUTED',
        label: 'Executed "Database Connection Pool" runbook',
        details: 'Increased connection pool size from 20 to 50',
      },
      {
        actorType: 'USER',
        actorRef: 'oncall-engineer',
        actionKind: 'NOTE_ADDED',
        label: 'Error rate decreasing after pool size increase',
        details: 'Monitoring shows improvement, errors down to 2.1%',
      },
      {
        actorType: 'USER',
        actorRef: 'oncall-engineer',
        actionKind: 'MITIGATION_ATTEMPTED',
        label: 'Rolled back deployment #1234',
        details: 'Using blue-green deployment strategy for safe rollback',
      },
      {
        actorType: 'SYSTEM',
        actorRef: 'health-check',
        actionKind: 'STATUS_UPDATE',
        label: 'All health checks passing',
        details: 'Service returned to normal operation',
      },
      {
        actorType: 'USER',
        actorRef: 'oncall-engineer',
        actionKind: 'NOTE_ADDED',
        label: 'Root cause identified: inefficient database query in new code',
        details: 'The deployment introduced an N+1 query that exhausted connections',
      },
    ];

    // Add actions with time progression
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      try {
        await addIncidentAction(org.id, incident.id, {
          actorType: action.actorType,
          actorRef: action.actorRef,
          actionKind: action.actionKind,
          label: action.label,
          details: action.details,
        });
        console.log(`   ✅ Added action: ${action.actionKind}`);
        
        // Small delay to ensure chronological order
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (err) {
        console.error(`   ❌ Failed to add action:`, err);
      }
    }

    console.log('');
  }

  console.log('🎉 Signals and actions seeding complete!\n');
  console.log('💡 Now visit an incident detail page to see:');
  console.log('   - Signals & Metrics card populated with 6 different signal types');
  console.log('   - Timeline with 9 chronological actions and signals');
  console.log('   - Realistic incident progression from detection to resolution');
  console.log('   - Mix of user actions and system events');
  console.log('\n🚀 The UI polish will really shine with this rich data!');
}

seedSignalsAndActions()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
