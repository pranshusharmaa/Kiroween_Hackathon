/**
 * Runbook helpers for Knowledge & Runbook Service (KRS)
 * 
 * For now, runbooks are stored as markdown files in a runbooks/ directory
 * or could be fetched from a CMS/wiki. This is a placeholder implementation.
 */

/**
 * Get runbook markdown for a service
 * Returns null if no runbook found
 */
export async function getRunbookForService(
  orgId: string,
  serviceName: string
): Promise<string | null> {
  // TODO: Implement actual runbook storage/retrieval
  // Options:
  // 1. Store in database as Runbook model
  // 2. Fetch from file system (runbooks/<service>.md)
  // 3. Fetch from external CMS/wiki via API
  // 4. Fetch from GitHub repo via MCP

  // For now, return a placeholder runbook
  const placeholderRunbooks: Record<string, string> = {
    'api-gateway': `# API Gateway Runbook

## Symptoms
- High error rate (5xx responses)
- Increased latency
- Connection timeouts

## Impact
- Users unable to access API endpoints
- Degraded service performance

## Diagnosis
1. Check error logs in CloudWatch/Datadog
2. Verify database connection pool status
3. Check upstream service health
4. Review recent deployments

## Mitigation
### Rollback
If error rate spiked after recent deploy:
\`\`\`bash
kubectl rollout undo deployment/api-gateway
\`\`\`

### Scale Up
If load-related:
\`\`\`bash
kubectl scale deployment/api-gateway --replicas=10
\`\`\`

### Circuit Breaker
If upstream service is failing:
- Enable circuit breaker in service mesh
- Route traffic to backup endpoints

## Prevention
- Add more comprehensive integration tests
- Implement gradual rollout (canary deployments)
- Set up better monitoring and alerting
- Review and optimize database queries
`,
    'checkout': `# Checkout Service Runbook

## Symptoms
- Payment processing failures
- Order creation errors
- Timeout errors

## Impact
- Users unable to complete purchases
- Revenue loss

## Diagnosis
1. Check payment gateway status
2. Verify database connectivity
3. Review inventory service health
4. Check for rate limiting

## Mitigation
### Payment Gateway Issues
- Switch to backup payment processor
- Enable retry logic with exponential backoff

### Database Issues
- Scale read replicas
- Clear connection pool
- Restart service if connection leak detected

### Inventory Service Issues
- Enable graceful degradation
- Allow orders without real-time inventory check

## Prevention
- Implement circuit breakers for external dependencies
- Add comprehensive error handling
- Set up synthetic monitoring
- Regular load testing
`,
  };

  return placeholderRunbooks[serviceName] || null;
}

/**
 * List available runbooks for an organization
 */
export async function listRunbooks(orgId: string): Promise<Array<{ serviceName: string; title: string }>> {
  // TODO: Implement actual runbook listing
  return [
    { serviceName: 'api-gateway', title: 'API Gateway Runbook' },
    { serviceName: 'checkout', title: 'Checkout Service Runbook' },
    { serviceName: 'search', title: 'Search Service Runbook' },
  ];
}
