import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { getMetricSummaryForServiceWindow } from '../src/modules/metrics/metrics-adapter';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Inline the guardrail check logic to avoid circular dependency
async function runGuardrailCheckForDeployment(orgId: string, deploymentId: string) {
  const deployment = await prisma.deploymentEvent.findUnique({
    where: { id: deploymentId },
  });

  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  const deployedAt = deployment.deployedAt;
  const BASELINE_DURATION_MIN = 30;
  const NEW_DURATION_MIN = 15;

  const baselineWindow = {
    start: new Date(deployedAt.getTime() - BASELINE_DURATION_MIN * 60 * 1000),
    end: deployedAt,
  };

  const newWindow = {
    start: deployedAt,
    end: new Date(deployedAt.getTime() + NEW_DURATION_MIN * 60 * 1000),
  };

  const baselineMetrics = await getMetricSummaryForServiceWindow(
    orgId,
    deployment.serviceName,
    deployment.environment,
    baselineWindow
  );

  const newMetrics = await getMetricSummaryForServiceWindow(
    orgId,
    deployment.serviceName,
    deployment.environment,
    newWindow
  );

  const latencyDeltaPct =
    baselineMetrics.p95LatencyMs > 0
      ? ((newMetrics.p95LatencyMs - baselineMetrics.p95LatencyMs) / baselineMetrics.p95LatencyMs) * 100
      : 0;

  const errorRateDeltaPct =
    baselineMetrics.errorRate > 0
      ? ((newMetrics.errorRate - baselineMetrics.errorRate) / baselineMetrics.errorRate) * 100
      : 0;

  // Classify
  let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  const issues: string[] = [];

  if (latencyDeltaPct >= 50) {
    status = 'FAIL';
    issues.push(`P95 latency increased by ${latencyDeltaPct.toFixed(1)}%`);
  } else if (latencyDeltaPct >= 20) {
    if (status !== 'FAIL') status = 'WARN';
    issues.push(`P95 latency increased by ${latencyDeltaPct.toFixed(1)}%`);
  }

  if (errorRateDeltaPct >= 100 || newMetrics.errorRate >= 0.1) {
    status = 'FAIL';
    issues.push(`Error rate increased by ${errorRateDeltaPct.toFixed(1)}% to ${(newMetrics.errorRate * 100).toFixed(2)}%`);
  } else if (errorRateDeltaPct >= 50 || newMetrics.errorRate >= 0.05) {
    if (status !== 'FAIL') status = 'WARN';
    issues.push(`Error rate increased by ${errorRateDeltaPct.toFixed(1)}% to ${(newMetrics.errorRate * 100).toFixed(2)}%`);
  }

  const reason = status === 'PASS' ? 'Metrics within acceptable thresholds' : issues.join('; ');

  const check = await prisma.changeGuardrailCheck.create({
    data: {
      orgId,
      deploymentId,
      serviceName: deployment.serviceName,
      environment: deployment.environment,
      status,
      reason,
      baselineWindowStart: baselineWindow.start,
      baselineWindowEnd: baselineWindow.end,
      newWindowStart: newWindow.start,
      newWindowEnd: newWindow.end,
      baselineP95LatencyMs: baselineMetrics.p95LatencyMs,
      baselineErrorRate: baselineMetrics.errorRate,
      newP95LatencyMs: newMetrics.p95LatencyMs,
      newErrorRate: newMetrics.errorRate,
      latencyDeltaPct,
      errorRateDeltaPct,
    },
  });

  return {
    id: check.id,
    status: check.status as 'PASS' | 'WARN' | 'FAIL',
    reason: check.reason,
    baselineP95LatencyMs: check.baselineP95LatencyMs,
    baselineErrorRate: check.baselineErrorRate,
    newP95LatencyMs: check.newP95LatencyMs,
    newErrorRate: check.newErrorRate,
    latencyDeltaPct: check.latencyDeltaPct,
    errorRateDeltaPct: check.errorRateDeltaPct,
  };
}

async function main() {
  console.log('🚀 Seeding deployment events and guardrail checks...\n');

  // Get first org and project
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('No organization found. Run main seed first.');
    return;
  }

  const project = await prisma.project.findFirst({
    where: { orgId: org.id },
  });
  if (!project) {
    console.error('No project found. Run main seed first.');
    return;
  }

  // Get some incidents to link deployments to
  const incidents = await prisma.incidentSnapshot.findMany({
    where: { orgId: org.id },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  if (incidents.length === 0) {
    console.error('No incidents found. Run main seed first.');
    return;
  }

  const services = ['api-gateway', 'payment-service', 'auth-service', 'database-service'];
  const environments = ['production', 'staging'];
  const changeTypes = ['DEPLOY', 'CONFIG_CHANGE', 'ROLLBACK', 'SCALE'];
  const authors = ['@alice', '@bob', '@charlie', '@diana'];

  const deploymentTitles = [
    'Update payment gateway timeout settings',
    'Deploy v2.3.4 with performance improvements',
    'Rollback to previous stable version',
    'Scale up database connection pool',
    'Update authentication middleware',
    'Deploy hotfix for memory leak',
    'Configuration change: increase rate limits',
    'Deploy new caching layer',
    'Update API gateway routing rules',
    'Scale down unused services',
  ];

  let deploymentsCreated = 0;
  let checksCreated = 0;

  // Create deployments for each incident
  for (const incident of incidents) {
    const numDeployments = Math.floor(Math.random() * 2) + 1; // 1-2 deployments per incident

    for (let i = 0; i < numDeployments; i++) {
      const incidentTime = new Date(incident.createdAt);
      // Deployment happened 5-60 minutes before the incident
      const minutesBefore = Math.floor(Math.random() * 55) + 5;
      const deployedAt = new Date(incidentTime.getTime() - minutesBefore * 60 * 1000);

      const deployment = await prisma.deploymentEvent.create({
        data: {
          orgId: org.id,
          projectId: project.id,
          serviceName: incident.serviceName,
          environment: incident.environment,
          changeType: changeTypes[Math.floor(Math.random() * changeTypes.length)],
          source: Math.random() > 0.5 ? 'GITHUB' : 'GITLAB',
          externalId: `deploy-${Math.random().toString(36).substring(7)}`,
          title: deploymentTitles[Math.floor(Math.random() * deploymentTitles.length)],
          author: authors[Math.floor(Math.random() * authors.length)],
          deployedAt,
          incidentId: incident.id,
        },
      });

      deploymentsCreated++;
      console.log(`✅ Created deployment: ${deployment.title}`);
      console.log(`   Service: ${deployment.serviceName}, Environment: ${deployment.environment}`);
      console.log(`   Deployed: ${minutesBefore} min before incident`);

      // Run guardrail check for this deployment
      try {
        const check = await runGuardrailCheckForDeployment(org.id, deployment.id);
        checksCreated++;
        console.log(`   📊 Guardrail check: ${check.status} - ${check.reason}`);
        console.log(`   Latency: ${Math.round(check.baselineP95LatencyMs)}ms → ${Math.round(check.newP95LatencyMs)}ms (${check.latencyDeltaPct > 0 ? '+' : ''}${check.latencyDeltaPct.toFixed(1)}%)`);
        console.log(`   Error Rate: ${(check.baselineErrorRate * 100).toFixed(2)}% → ${(check.newErrorRate * 100).toFixed(2)}% (${check.errorRateDeltaPct > 0 ? '+' : ''}${check.errorRateDeltaPct.toFixed(1)}%)`);
      } catch (error) {
        console.error(`   ❌ Failed to run guardrail check:`, error);
      }

      console.log('');
    }
  }

  // Create some additional deployments without incidents (for other services)
  const additionalDeployments = 3;
  for (let i = 0; i < additionalDeployments; i++) {
    const service = services[Math.floor(Math.random() * services.length)];
    const environment = environments[Math.floor(Math.random() * environments.length)];
    const deployedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const deployment = await prisma.deploymentEvent.create({
      data: {
        orgId: org.id,
        projectId: project.id,
        serviceName: service,
        environment,
        changeType: changeTypes[Math.floor(Math.random() * changeTypes.length)],
        source: Math.random() > 0.5 ? 'GITHUB' : 'GITLAB',
        externalId: `deploy-${Math.random().toString(36).substring(7)}`,
        title: deploymentTitles[Math.floor(Math.random() * deploymentTitles.length)],
        author: authors[Math.floor(Math.random() * authors.length)],
        deployedAt,
        incidentId: null, // No incident linked
      },
    });

    deploymentsCreated++;
    console.log(`✅ Created standalone deployment: ${deployment.title}`);
    console.log(`   Service: ${deployment.serviceName}, Environment: ${deployment.environment}`);

    // Run guardrail check
    try {
      const check = await runGuardrailCheckForDeployment(org.id, deployment.id);
      checksCreated++;
      console.log(`   📊 Guardrail check: ${check.status}`);
    } catch (error) {
      console.error(`   ❌ Failed to run guardrail check:`, error);
    }

    console.log('');
  }

  console.log(`\n🎉 Deployment seeding complete!`);
  console.log(`   Created ${deploymentsCreated} deployments`);
  console.log(`   Created ${checksCreated} guardrail checks`);
  console.log(`\n💡 Visit an incident detail page to see the "What Changed?" section with guardrail checks!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
