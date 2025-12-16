export const COLLECTIONS = {
  // User collections
  users: 'users',
  userActivities: 'user_activities',
  
  // Church collections
  churches: 'churches',
  branches: 'branches',
  churchAdmins: 'church_admins',
  branchAdmins: 'branch_admins',
  
  // Subscription collections
  subscriptions: 'subscriptions',
  subscriptionPlans: 'subscription_plans',
  usageMetrics: 'usage_metrics',
  
  // Event collections
  events: 'events',
  eventRegistrations: 'event_registrations',
  eventAttendances: 'event_registrations', // Alias for event_registrations
  
  // Giving collections
  givingProjects: 'giving_projects',
  projects: 'giving_projects', // Alias for giving_projects
  donations: 'donations',
  giving: 'donations', // Alias for donations
  givingConfig: 'giving_config',
  
  // Community collections
  posts: 'posts',
  comments: 'comments',
  
  // Prayer collections
  prayerRequests: 'prayer_requests',
  prayerInteractions: 'prayer_interactions',
  
  // Sermon collections
  sermons: 'sermons',
  sermonViews: 'sermon_views',
  sermonDownloads: 'sermon_downloads',
  
  // Children collections
  children: 'children',
  checkIns: 'check_ins',
  childrenCheckIns: 'check_ins', // Alias for check_ins
  
  // Group collections
  groups: 'groups',
  groupMembers: 'group_members',
  groupMemberships: 'group_members', // Alias for group_members
  
  // Volunteer collections
  volunteers: 'volunteers',
  volunteerShifts: 'volunteer_shifts',
  
  // Badge collections
  badges: 'badges',
  userBadges: 'user_badges',
  
  // Reading Plan collections
  readingPlans: 'reading_plans',
  readingPlanProgress: 'reading_plan_progress',
  
  // Payroll collections
  payrollPositions: 'payroll_positions',
  payrollPeriods: 'payroll_periods',
  payrollPayments: 'payroll_payments',
  payrollRecords: 'payroll_payments', // Alias for payroll_payments
  salaries: 'payroll_payments', // Alias for payroll_payments
  wageScales: 'wage_scales',
  
  // Message collections
  messages: 'messages',
  messageRecipients: 'message_recipients',
  groupMessages: 'group_messages',
  
  // Password reset collections
  passwordResets: 'password_resets',
  passwordResetTokens: 'password_resets', // Alias for password_resets
  
  // Workforce collections
  workforceTasks: 'workforce_tasks',
  tasks: 'workforce_tasks', // Alias for workforce_tasks
  
  // Follow-up collections
  followUps: 'follow_ups',
  mentorAssignments: 'mentor_assignments',
  
  // Department collections
  departments: 'departments',
  
  // AI collections
  aiCoachingSessions: 'ai_coaching_sessions',
  aiGrowthPlans: 'ai_growth_plans',
} as const

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]
