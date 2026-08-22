export class AnalyticsCacheService {
  static async getCachedAnalytics(churchId: string, key: string): Promise<any | null> {
    return null
  }

  static async setCachedAnalytics(churchId: string, key: string, data: any, ttlSeconds?: number): Promise<void> {
  }
}
