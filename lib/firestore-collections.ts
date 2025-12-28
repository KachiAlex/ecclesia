export const COLLECTIONS = {
  // User collections
  users: 'users',
  userActivities: 'user_activities',
  
  // Church collections
  churches: 'churches',
  branches: 'branches',
  churchAdmins: 'church_admins',
  branchAdmins: 'branch_admins',
  churchInvites: 'church_invites',
  churchDesignations: 'church_designations',
  churchRoles: 'church_roles',
  staffLevels: 'staff_levels',
  
  // Subscription collections
  subscriptions: 'subscriptions',
  subscriptionPlans: 'subscription_plans',
  subscriptionPlanOverrides: 'subscription_plan_overrides',
  subscriptionPromos: 'subscription_promos',
  usageMetrics: 'usage_metrics',
  subscriptionPayments: 'subscription_payments',
  
  // Event collections
  events: 'events',
  eventRegistrations: 'event_registrations',
  eventAttendances: 'event_attendances', // Alias for event_registrations
  eventReminders: 'event_reminders',
  
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

  // Livestream collections
  livestreams: 'livestreams',

  meetings: 'meetings',

  churchGoogleTokens: 'church_google_tokens',

  churchGoogleOauthStates: 'church_google_oauth_states',

  accountingExpenses: 'accounting_expenses',
  accountingIncome: 'accounting_income',

  attendanceSessions: 'attendance_sessions',
  attendanceRecords: 'attendance_records',
  
  // Children collections
  children: 'children',
  checkIns: 'check_ins',
  childrenCheckIns: 'check_ins', // Alias for check_ins
  
  // Group collections
  groups: 'groups',
  groupMembers: 'group_members',
  groupMemberships: 'group_members', // Alias for group_members

  unitTypes: 'unit_types',
  units: 'units',
  unitMemberships: 'unit_memberships',
  unitInvites: 'unit_invites',
  unitSettings: 'unit_settings',
  unitMessages: 'unit_messages',
  unitPolls: 'unit_polls',
  unitPollVotes: 'unit_poll_votes',
  
  // Volunteer collections
  volunteers: 'volunteers',
  volunteerShifts: 'volunteer_shifts',
  
  // Badge collections
  badges: 'badges',
  userBadges: 'user_badges',
  
  // Reading Plan collections
  readingPlans: 'reading_plans',
  readingPlanProgress: 'reading_plan_progress',
  readingPlanDays: 'reading_plan_days',
  readingPlanResources: 'reading_plan_resources',
  readingResourceCategories: 'reading_resource_categories',
  biblePassageCache: 'bible_passage_cache',
  readingCoachSessions: 'reading_coach_sessions',
  readingCoachNudges: 'reading_coach_nudges',
  
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

  // Digital School collections
  digitalCourses: 'digital_courses',
  digitalCourseSections: 'digital_course_sections',
  digitalCourseModules: 'digital_course_modules',
  digitalCourseLessons: 'digital_course_lessons',
  digitalCourseAccessRequests: 'digital_course_access_requests',
  digitalCourseEnrollments: 'digital_course_enrollments',
  digitalCourseExams: 'digital_course_exams',
  digitalExamQuestions: 'digital_exam_questions',
  digitalExamAttempts: 'digital_exam_attempts',
  digitalCourseBadges: 'digital_course_badges',
} as const

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]
