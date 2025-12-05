import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Checking deployment data...\n');

  const deploymentCount = await prisma.deploymentEvent.count();
  console.log(`Total deployments: ${deploymentCount}`);

  const deploymentsWithIncidents = await prisma.deploymentEvent.count({
    where: { incidentId: { not: null } },
  });
  console.log(`Deployments linked to incidents: ${deploymentsWithIncidents}`);

  const checksCount = await prisma.changeGuardrailCheck.count();
  console.log(`Total guardrail checks: ${checksCount}\n`);

  // Show sample deployments
  const sampleDeployments = await prisma.deploymentEvent.findMany({
    where: { incidentId: { not: null } },
    take: 3,
    include: {
      guardrailChecks: true,
    },
  });

  console.log('Sample deployments with incidents:');
  sampleDeployments.forEach((d) => {
    console.log(`\n- ${d.title}`);
    console.log(`  Incident ID: ${d.incidentId}`);
    console.log(`  Service: ${d.serviceName}, Env: ${d.environment}`);
    console.log(`  Guardrail checks: ${d.guardrailChecks.length}`);
    if (d.guardrailChecks.length > 0) {
      console.log(`  Status: ${d.guardrailChecks[0].status}`);
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
