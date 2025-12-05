import { createHash } from 'crypto';
import { DataPathFeatures, NormalizedEvent } from './types';

/**
 * Extract data path features from normalized event context
 * Looks for stable business identifiers that persist across service boundaries
 */
export function extractDataPathFeatures(
  context: Record<string, unknown>
): DataPathFeatures {
  const features: DataPathFeatures = {};

  // Extract HTTP route/path
  if (context.route) features.route = String(context.route);
  else if (context.path) features.route = String(context.path);
  else if (context.httpRoute) features.route = String(context.httpRoute);
  else if (context.topic) features.route = String(context.topic);
  else if (context.queue) features.route = String(context.queue);

  // Extract business identifiers
  if (context.accountId) features.accountId = String(context.accountId);
  if (context.customerId) features.customerId = String(context.customerId);
  if (context.orderId) features.orderId = String(context.orderId);
  if (context.userId) features.userId = String(context.userId);
  if (context.tenantId) features.tenantId = String(context.tenantId);

  // Also check nested objects
  if (context.request && typeof context.request === 'object') {
    const req = context.request as Record<string, unknown>;
    if (req.path) features.route = String(req.path);
    if (req.route) features.route = String(req.route);
  }

  if (context.user && typeof context.user === 'object') {
    const user = context.user as Record<string, unknown>;
    if (user.id) features.userId = String(user.id);
    if (user.accountId) features.accountId = String(user.accountId);
  }

  return features;
}

/**
 * Compute a stable data path key from features
 * This key groups events by business flow regardless of trace/request IDs
 */
export function computeDataPathKey(
  serviceName: string,
  features: DataPathFeatures
): string | undefined {
  // Need at least a route or business key
  if (!features.route && !features.accountId && !features.customerId && !features.orderId) {
    return undefined;
  }

  // Build a stable key from available features
  const parts: string[] = [serviceName];

  if (features.route) {
    // Normalize route by removing IDs (e.g., /users/123 -> /users/:id)
    const normalizedRoute = normalizeRoute(features.route);
    parts.push(`route:${normalizedRoute}`);
  }

  // Add business keys in consistent order
  if (features.accountId) parts.push(`account:${features.accountId}`);
  if (features.customerId) parts.push(`customer:${features.customerId}`);
  if (features.orderId) parts.push(`order:${features.orderId}`);
  if (features.userId) parts.push(`user:${features.userId}`);
  if (features.tenantId) parts.push(`tenant:${features.tenantId}`);

  // Hash to create a stable, compact key
  const combined = parts.join('|');
  const hash = createHash('sha256').update(combined).digest('hex');
  
  // Return first 16 chars for readability
  return `dp_${hash.substring(0, 16)}`;
}

/**
 * Normalize HTTP routes by replacing IDs with placeholders
 * Examples:
 *   /users/123 -> /users/:id
 *   /orders/abc-def/items -> /orders/:id/items
 */
function normalizeRoute(route: string): string {
  return route
    .split('/')
    .map(segment => {
      // Replace UUIDs
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        return ':id';
      }
      // Replace numeric IDs
      if (/^\d+$/.test(segment)) {
        return ':id';
      }
      // Replace alphanumeric IDs (longer than 8 chars)
      if (/^[a-z0-9_-]{8,}$/i.test(segment)) {
        return ':id';
      }
      return segment;
    })
    .join('/');
}

/**
 * Enrich a normalized event with data path information
 */
export function enrichWithDataPath(event: NormalizedEvent): NormalizedEvent {
  const features = extractDataPathFeatures(event.metadata);
  
  if (Object.keys(features).length === 0) {
    return event;
  }

  const dataPathKey = computeDataPathKey(event.serviceName, features);

  return {
    ...event,
    dataPathKey,
    dataPathFeatures: features,
  };
}
