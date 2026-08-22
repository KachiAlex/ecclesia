export class DataAggregationService {
  static async getHistoricalEvents(churchId: string, days: number): Promise<Array<{
    actualAttendees: number
    dayOfWeek: string
    timeOfDay: string
  }>> {
    return []
  }
}
