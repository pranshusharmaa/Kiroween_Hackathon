/**
 * Cosine Similarity for Incident Matching
 * Uses TF-IDF-like approach to find similar incidents based on text content
 */

interface IncidentText {
  id: string;
  title: string;
  description?: string;
  serviceName: string;
  severity: string;
  status: string;
}

/**
 * Tokenize and normalize text
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter out short words
}

/**
 * Create a term frequency map
 */
function termFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return freq;
}

/**
 * Calculate cosine similarity between two term frequency maps
 */
function cosineSimilarity(tf1: Map<string, number>, tf2: Map<string, number>): number {
  // Get all unique terms
  const allTerms = new Set([...tf1.keys(), ...tf2.keys()]);
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (const term of allTerms) {
    const freq1 = tf1.get(term) || 0;
    const freq2 = tf2.get(term) || 0;
    
    dotProduct += freq1 * freq2;
    magnitude1 += freq1 * freq1;
    magnitude2 += freq2 * freq2;
  }
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

/**
 * Extract features from an incident for similarity comparison
 */
function extractFeatures(incident: IncidentText): string {
  const parts = [
    incident.title,
    incident.description || '',
    incident.serviceName,
    // Weight severity and status less
    incident.severity.toLowerCase(),
    incident.status.toLowerCase(),
  ];
  
  return parts.join(' ');
}

/**
 * Find similar incidents using cosine similarity
 */
export function findSimilarIncidents(
  targetIncident: IncidentText,
  allIncidents: IncidentText[],
  threshold: number = 0.3,
  limit: number = 5
): Array<{ incident: IncidentText; similarity: number }> {
  // Extract and tokenize target incident
  const targetText = extractFeatures(targetIncident);
  const targetTokens = tokenize(targetText);
  const targetTF = termFrequency(targetTokens);
  
  // Calculate similarity for each incident
  const similarities = allIncidents
    .filter(inc => inc.id !== targetIncident.id) // Exclude self
    .map(incident => {
      const incidentText = extractFeatures(incident);
      const incidentTokens = tokenize(incidentText);
      const incidentTF = termFrequency(incidentTokens);
      
      const similarity = cosineSimilarity(targetTF, incidentTF);
      
      return { incident, similarity };
    })
    .filter(result => result.similarity >= threshold) // Filter by threshold
    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
    .slice(0, limit); // Limit results
  
  return similarities;
}

/**
 * Calculate similarity score between two incidents (0-100)
 */
export function calculateSimilarityScore(
  incident1: IncidentText,
  incident2: IncidentText
): number {
  const text1 = extractFeatures(incident1);
  const text2 = extractFeatures(incident2);
  
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);
  
  const tf1 = termFrequency(tokens1);
  const tf2 = termFrequency(tokens2);
  
  const similarity = cosineSimilarity(tf1, tf2);
  
  return Math.round(similarity * 100);
}

/**
 * Group incidents by similarity clusters
 */
export function clusterIncidents(
  incidents: IncidentText[],
  threshold: number = 0.5
): Array<IncidentText[]> {
  const clusters: Array<IncidentText[]> = [];
  const processed = new Set<string>();
  
  for (const incident of incidents) {
    if (processed.has(incident.id)) continue;
    
    // Find similar incidents
    const similar = findSimilarIncidents(incident, incidents, threshold, 10);
    
    // Create cluster
    const cluster = [incident, ...similar.map(s => s.incident)];
    
    // Mark as processed
    cluster.forEach(inc => processed.add(inc.id));
    
    clusters.push(cluster);
  }
  
  return clusters;
}
