export interface PropertyAnalyticsMetrics {
  views: number;
  whatsappClicks: number;
  emailClicks: number;
  visitRequests: number;
  shares: number;
  ctr: number;
}

export async function getPropertyAnalytics(propertyId: string): Promise<PropertyAnalyticsMetrics> {
  // In production, this computes aggregated metrics from analytics tables or Redis.
  return {
    views: 124,
    whatsappClicks: 18,
    emailClicks: 6,
    visitRequests: 4,
    shares: 12,
    ctr: 14.5, // %
  };
}
