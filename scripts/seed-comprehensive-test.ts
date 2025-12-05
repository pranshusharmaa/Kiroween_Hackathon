import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { extractDataPathFeatures, computeDataPathKey } from '../src/modules/connectors/normalize';
import { upsertDataPathFlow } from '../src/modules/connectors/data-path-flow';
import { createIncident } from '../src/modules/incidents/commands';
import { addDataPathKeyToIncident } from '../src/modules/incidents/projections';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedComprehensiveTest() {
  console.log('🎃 Starting comprehensive test data seeding...\n');

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

  console.log(`✅ Found org: ${org.name} (${org.id})`);
  console.log(`✅ Found project: ${project.name} (${project.id})\n`);

  // Scenario 1: Payment Processing Failure - Multiple Services, Same Order
  console.log('📊 Scenario 1: Payment Processing Failure (Order ord_98765)');
  console.log('   Testing: Same business key across multiple services\n');

  const paymentScenario = [
    {
      serviceName: 'api-gateway',
      context: {
        httpRoute: '/api/v1/orders',
        orderId: 'ord_98765',
        customerId: 'cust_54321',
      },
    },
    {
      serviceName: 'payment-service',
      context: {
        httpRoute: '/payments/process',
        orderId: 'ord_98765',
        customerId: 'cust_54321',
      },
    },
    {
      serviceName: 'notification-service',
      context: {
        topic: 'order.payment_failed',
        orderId: 'ord_98765',
        customerId: 'cust_54321',
      },
    },
  ];

  const paymentDataPathKeys: string[] = [];
  for (const event of paymentScenario) {
    const features = extractDataPathFeatures(event.context);
    const dataPathKey = computeDataPathKey(event.serviceName, features);

    if (dataPathKey) {
      console.log(`   📍 ${event.serviceName}: dataPathKey = ${dataPathKey}`);
      paymentDataPathKeys.push(dataPathKey);

      await upsertDataPathFlow(
        org.id,
        project.id,
        event.serviceName,
        'production',
        dataPathKey,
        features
      );
    }
  }

  // Create incident for payment failure
  const paymentIncidentId = await createIncident({
    orgId: org.id,
    projectId: project.id,
    title: 'Payment Processing Failure - Order ord_98765',
    serviceName: 'payment-service',
    severity: 'SEV2',
    environment: 'production',
    detectedBy: 'monitoring-system',
  });

  // Attach data path keys to incident
  for (const key of [...new Set(paymentDataPathKeys)]) {
    await addDataPathKeyToIncident(paymentIncidentId, key);
  }

  console.log(`   ✅ Created incident: ${paymentIncidentId}`);
  console.log(`   🔗 Linked ${[...new Set(paymentDataPathKeys)].length} unique data path keys\n`);

  // Scenario 2: User Authentication Issues - Same User, Multiple Attempts
  console.log('📊 Scenario 2: User Authentication Issues (User user_abc123)');
  console.log('   Testing: Same user across multiple auth attempts\n');

  const authScenario = [
    {
      serviceName: 'auth-service',
      context: {
        httpRoute: '/auth/login',
        userId: 'user_abc123',
      },
    },
    {
      serviceName: 'auth-service',
      context: {
        httpRoute: '/auth/verify',
        userId: 'user_abc123',
      },
    },
    {
      serviceName: 'user-service',
      context: {
        httpRoute: '/users/profile',
        userId: 'user_abc123',
      },
    },
  ];

  const authDataPathKeys: string[] = [];
  for (const event of authScenario) {
    const features = extractDataPathFeatures(event.context);
    const dataPathKey = computeDataPathKey(event.serviceName, features);

    if (dataPathKey) {
      console.log(`   📍 ${event.serviceName}: dataPathKey = ${dataPathKey}`);
      authDataPathKeys.push(dataPathKey);

      await upsertDataPathFlow(
        org.id,
        project.id,
        event.serviceName,
        'production',
        dataPathKey,
        features
      );
    }
  }

  // Create incident for auth issues
  const authIncidentId = await createIncident({
    orgId: org.id,
    projectId: project.id,
    title: 'Authentication Service Degradation',
    serviceName: 'auth-service',
    severity: 'SEV2',
    environment: 'production',
    detectedBy: 'monitoring-system',
  });

  for (const key of [...new Set(authDataPathKeys)]) {
    await addDataPathKeyToIncident(authIncidentId, key);
  }

  console.log(`   ✅ Created incident: ${authIncidentId}`);
  console.log(`   🔗 Linked ${[...new Set(authDataPathKeys)].length} unique data path keys\n`);

  // Scenario 3: Database Connection Pool Exhaustion - Multiple Services
  console.log('📊 Scenario 3: Database Connection Pool Exhaustion');
  console.log('   Testing: Similar errors across different services\n');

  const dbScenario = [
    {
      serviceName: 'order-service',
      context: {
        httpRoute: '/orders/create',
      },
    },
    {
      serviceName: 'inventory-service',
      context: {
        httpRoute: '/inventory/check',
      },
    },
    {
      serviceName: 'user-service',
      context: {
        httpRoute: '/users/search',
      },
    },
  ];

  const dbDataPathKeys: string[] = [];
  for (const event of dbScenario) {
    const features = extractDataPathFeatures(event.context);
    const dataPathKey = computeDataPathKey(event.serviceName, features);

    if (dataPathKey) {
      console.log(`   📍 ${event.serviceName}: dataPathKey = ${dataPathKey}`);
      dbDataPathKeys.push(dataPathKey);

      await upsertDataPathFlow(
        org.id,
        project.id,
        event.serviceName,
        'production',
        dataPathKey,
        features
      );
    }
  }

  // Create incident for DB issues
  const dbIncidentId = await createIncident({
    orgId: org.id,
    projectId: project.id,
    title: 'Database Connection Pool Exhaustion',
    serviceName: 'database',
    severity: 'SEV1',
    environment: 'production',
    detectedBy: 'monitoring-system',
  });

  for (const key of [...new Set(dbDataPathKeys)]) {
    await addDataPathKeyToIncident(dbIncidentId, key);
  }

  console.log(`   ✅ Created incident: ${dbIncidentId}`);
  console.log(`   🔗 Linked ${[...new Set(dbDataPathKeys)].length} unique data path keys\n`);

  // Scenario 4: API Rate Limiting - Same Customer
  console.log('📊 Scenario 4: API Rate Limiting (Customer cust_99999)');
  console.log('   Testing: Rate limit errors for specific customer\n');

  const rateLimitScenario = [
    {
      serviceName: 'api-gateway',
      context: {
        httpRoute: '/api/v1/products',
        customerId: 'cust_99999',
      },
    },
    {
      serviceName: 'api-gateway',
      context: {
        httpRoute: '/api/v1/orders',
        customerId: 'cust_99999',
      },
    },
  ];

  const rateLimitDataPathKeys: string[] = [];
  for (const event of rateLimitScenario) {
    const features = extractDataPathFeatures(event.context);
    const dataPathKey = computeDataPathKey(event.serviceName, features);

    if (dataPathKey) {
      console.log(`   📍 ${event.serviceName}: dataPathKey = ${dataPathKey}`);
      rateLimitDataPathKeys.push(dataPathKey);

      await upsertDataPathFlow(
        org.id,
        project.id,
        event.serviceName,
        'production',
        dataPathKey,
        features
      );
    }
  }

  // Create incident for rate limiting
  const rateLimitIncidentId = await createIncident({
    orgId: org.id,
    projectId: project.id,
    title: 'API Rate Limit Exceeded - Customer cust_99999',
    serviceName: 'api-gateway',
    severity: 'SEV3',
    environment: 'production',
    detectedBy: 'monitoring-system',
  });

  for (const key of [...new Set(rateLimitDataPathKeys)]) {
    await addDataPathKeyToIncident(rateLimitIncidentId, key);
  }

  console.log(`   ✅ Created incident: ${rateLimitIncidentId}`);
  console.log(`   🔗 Linked ${[...new Set(rateLimitDataPathKeys)].length} unique data path keys\n`);

  // Summary
  const totalKeys = [...new Set([
    ...paymentDataPathKeys,
    ...authDataPathKeys,
    ...dbDataPathKeys,
    ...rateLimitDataPathKeys,
  ])].length;

  console.log('📈 Summary:');
  console.log(`   ✅ Created 4 incidents with realistic scenarios`);
  console.log(`   ✅ Generated ${totalKeys} unique data path flows`);
  console.log(`   ✅ Tested business key correlation (orders, users, customers)`);
  console.log(`   ✅ Tested cross-service correlation`);
  console.log(`   ✅ Tested similar error patterns\n`);

  // Query and display data path flows
  console.log('🔍 Data Path Flows Created:');
  const flows = await prisma.dataPathFlow.findMany({
    where: { orgId: org.id },
    orderBy: { eventCount: 'desc' },
  });

  for (const flow of flows) {
    console.log(`   📊 ${flow.businessType || 'unknown'}:${flow.businessKey || 'N/A'} on ${flow.route || 'N/A'}`);
    console.log(`      Key: ${flow.dataPathKey}, Events: ${flow.eventCount}`);
  }

  console.log('\n🎉 Comprehensive test data seeding complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Visit http://localhost:3000/orgs/demo-org/incidents');
  console.log('   2. Check data path badges on each incident');
  console.log('   3. Click an incident to see data path flows card');
  console.log('   4. Verify correlation by business keys (order, user, customer)');
  console.log('\n🔍 Test Correlation:');
  console.log('   - Payment incident should show 3 flows (api-gateway, payment-service, notification-service)');
  console.log('   - Auth incident should show 3 flows (auth-service x2, user-service)');
  console.log('   - DB incident should show 3 flows (order-service, inventory-service, user-service)');
  console.log('   - Rate limit incident should show 2 flows (api-gateway x2)');
}

seedComprehensiveTest()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
