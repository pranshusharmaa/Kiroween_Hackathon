require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@runbookrevenant.dev' },
    update: {},
    create: {
      email: 'demo@runbookrevenant.dev',
      name: 'Demo User',
      authProvider: 'local',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create demo organization
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      billingPlan: 'enterprise',
    },
  });

  console.log('✅ Created demo organization:', demoOrg.name);

  // Create membership
  const membership = await prisma.membership.upsert({
    where: {
      orgId_userId: {
        orgId: demoOrg.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      orgId: demoOrg.id,
      userId: demoUser.id,
      role: 'ORG_ADMIN',
    },
  });

  console.log('✅ Created membership with role:', membership.role);

  // Create demo projects
  const checkoutProject = await prisma.project.upsert({
    where: {
      orgId_slug: {
        orgId: demoOrg.id,
        slug: 'checkout',
      },
    },
    update: {},
    create: {
      orgId: demoOrg.id,
      name: 'Checkout Service',
      slug: 'checkout',
      environments: ['production', 'staging', 'development'],
      defaultRunbookPath: '/runbooks/checkout.md',
    },
  });

  console.log('✅ Created project:', checkoutProject.name);

  const searchProject = await prisma.project.upsert({
    where: {
      orgId_slug: {
        orgId: demoOrg.id,
        slug: 'search',
      },
    },
    update: {},
    create: {
      orgId: demoOrg.id,
      name: 'Search Service',
      slug: 'search',
      environments: ['production', 'staging'],
      defaultRunbookPath: '/runbooks/search.md',
    },
  });

  console.log('✅ Created project:', searchProject.name);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
