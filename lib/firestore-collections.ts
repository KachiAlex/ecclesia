/**
 * Firestore Collection Names
 * Maps Prisma models to Firestore collections
 */

export const COLLECTIONS = {
  // Core
  users: 'users',
  churches: 'churches',
  
  // Subscriptions
  subscriptionPlans: 'subscriptionPlans',
  subscriptions: 'subscriptions',
  usageMetrics: 'usageMetrics',
  churchBranding: 'churchBranding',
  
  // Payroll
  payrollPositions: 'payrollPositions',
  wageScales: 'wageScales',
  salaries: 'salaries',
  payrollPeriods: 'payrollPeriods',
  payrollRecords: 'payrollRecords',
  
  // Departments & Groups
  departments: 'departments',
  groups: 'groups',
  groupMemberships: 'groupMemberships',
  
  // Discipleship
  readingPlans: 'readingPlans',
  readingPlanProgress: 'readingPlanProgress',
  aiCoachingSessions: 'aiCoachingSessions',
  followUps: 'followUps',
  mentorAssignments: 'mentorAssignments',
  
  // Social
  posts: 'posts',
  comments: 'comments',
  prayerRequests: 'prayerRequests',
  prayerInteractions: 'prayerInteractions',
  
  // Media
  sermons: 'sermons',
  sermonViews: 'sermonViews',
  sermonDownloads: 'sermonDownloads',
  
  // Projects & Giving
  projects: 'projects',
  giving: 'giving',
  
  // Events
  events: 'events',
  eventRegistrations: 'eventRegistrations',
  eventAttendances: 'eventAttendances',
  checkIns: 'checkIns',
  childrenCheckIns: 'childrenCheckIns',
  
  // Messaging
  messages: 'messages',
  groupMessages: 'groupMessages',
  
  // Gamification
  badges: 'badges',
  userBadges: 'userBadges',
  
  // Workforce
  volunteerShifts: 'volunteerShifts',
  tasks: 'tasks',
} as const

/**
 * Helper to get collection reference
 */
export function getCollection(collectionName: keyof typeof COLLECTIONS) {
  return COLLECTIONS[collectionName]
}

/**
 * Helper to get document reference
 */
export function getDocRef(collectionName: keyof typeof COLLECTIONS, docId: string) {
  const { db } = require('./firestore')
  return db.collection(COLLECTIONS[collectionName]).doc(docId)
}

/**
 * Helper to get subcollection reference
 */
export function getSubcollectionRef(
  collectionName: keyof typeof COLLECTIONS,
  docId: string,
  subcollectionName: string
) {
  const { db } = require('./firestore')
  return db.collection(COLLECTIONS[collectionName]).doc(docId).collection(subcollectionName)
}

