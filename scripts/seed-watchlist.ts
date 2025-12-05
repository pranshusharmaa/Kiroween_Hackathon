import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedWatchlist() {
  console.log('🎃 Seeding SLA Watchlist entries...');

  // Get demo org
  const org = await prisma.organization.findFirst({
    where: { slug: 'demo-org' },
  });

  if (!org) {
    console.error('❌ Demo org not found. Run seed script first.');
    return;
  }

  // Get a project
  const project = await prisma.project.findFirst({
    where: { orgId: org.id },
  });

  if (!project) {
    console.error('❌ No project found');
    return;
  }

  // Create sample watchlist entries
  const entries = [
    {
      orgId: org.id,
      projectId: project.id,
      serviceName: 'api-gateway',
      environment: 'production',
      status: 'AT_RISK',
      riskScore: 0.75,
      source: 'METRIC_TREND',
      logsSnapshot: [
        {
          level: 'WARN',
          message: 'Error rate approaching 2% threshold (current: 1.8%)',
          timestamp: new Date().toISOString(),
        },
        {
          level: 'ERROR',
          message: 'Database connection timeout in payment processing',
          timestamp: new Date().toISOString(),
        },
      ],
    },
    {
      orgId: org.id,
      projectId: project.id,
      serviceName: 'checkout-service',
      environment: 'production',
      status: 'BREACHED',
      riskScore: 0.95,
      source: 'ERROR_BURST',
      logsSnapshot: [
        {
          level: 'ERROR',
          message: 'SLO breach: 95% availability target missed (current: 92%)',
          timestamp: new Date().toISOString(),
        },
        {
          level: 'ERROR',
          message: 'Payment gateway timeout - 15 failed transactions in last 5 minutes',
          timestamp: new Date().toISOString(),
        },
      ],
    },
    {
      orgId: org.id,
      projectId: project.id,
      serviceName: 'search-api',
      environment: 'staging',
      status: 'AT_RISK',
      riskScore: 0.6,
      source: 'METRIC_TREND',
      logsSnapshot: [
        {
          level: 'WARN',
          message: 'Latency spike detected: p95 = 800ms (threshold: 500ms)',
          timestamp: new Date().toISOString(),
        },
      ],
    },
  ];

  for (const entry of entries) {
    await prisma.sLAWatchEntry.create({
      data: entry,
    });
    console.log(`✅ Created watchlist entry for ${entry.serviceName} (${entry.status})`);
  }

  console.log('🎉 Watchlist seeding complete!');
}

seedWatchlist()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
