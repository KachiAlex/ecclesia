/**
 * /components/recommendations/index.ts
 * Public API for recommendation components
 */

export { RecommendationDashboard } from './RecommendationDashboard'
export { AttendancePredictionCard } from './AttendancePredictionCard'
export { OptimalScheduleRecommendation } from './OptimalScheduleRecommendation'
export { MemberEngagementRecommendations } from './MemberEngagementRecommendations'
export { ContentRecommendations } from './ContentRecommendations'

export type {
  Recommendation,
  AttendancePrediction,
  OptimalSchedule,
  EngagementRecommendation,
} from '@/lib/services/recommendation-service'
