import 'dotenv/config';
import { getDeploymentsForIncident } from '../src/modules/metrics/change-guardrails';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧪 Testing deployments API logic...\n');

  // Get first org
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('No organization found');
    return;
  }
  console.log(`Org: ${org.name} (${org.id})`);

  // Get first incident with deployments
  const incident = await prisma.incidentSnapshot.findFirst({
    where: {
      orgId: org.id,
    },
  });

  if (!incident) {
    console.error('No incident found');
    return;
  }

  console.log(`Incident: ${incident.title} (${incident.id})\n`);

  // Test the API function
  try {
    const deployments = await getDeploymentsForIncident(org.id, incident.id);
    console.log(`✅ Found ${deployments.length} deployments for this incident`);
    
    deployments.forEach((d, i) => {
      console.log(`\n${i + 1}. ${d.title}`);
      console.log(`   Service: ${d.serviceName}, Env: ${d.environment}`);
      console.log(`   Deployed: ${d.deployedAt}`);
      console.log(`   Guardrail checks: ${d.guardrailChecks.length}`);
      if (d.guardrailChecks.length > 0) {
        const check = d.guardrailChecks[0];
        console.log(`   Status: ${check.status}`);
        console.log(`   Latency: ${Math.round(check.baselineP95LatencyMs)}ms → ${Math.round(check.newP95LatencyMs)}ms`);
        console.log(`   Error Rate: ${(check.baselineErrorRate * 100).toFixed(2)}% → ${(check.newErrorRate * 100).toFixed(2)}%`);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
