// Survey System Types

export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'

export type QuestionType = 'multiple_choice' | 'text' | 'rating' | 'yes_no'

export type TargetAudienceType = 'all' | 'groups' | 'roles' | 'custom'

export interface Survey {
  id: string
  churchId: string
  branchId?: string
  createdBy: string
  title: string
  description?: string
  status: SurveyStatus
  isAnonymous: boolean
  allowMultipleResponses: boolean
  deadline?: Date
  targetAudience: TargetAudience
  sendOnPublish: boolean
  sendReminders: boolean
  reminderDays: number[]
  meetingId?: string
  questions: SurveyQuestion[]
  responses?: SurveyResponse[]
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  closedAt?: Date
}

export interface SurveyQuestion {
  id: string
  surveyId?: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  order: number
  
  // Multiple choice specific
  options?: string[]
  allowMultiple?: boolean
  
  // Rating specific
  minRating?: number
  maxRating?: number
  ratingLabels?: { min?: string; max?: string }
  ratingStyle?: 'numbers' | 'stars'
  
  // Text specific
  textType?: 'short' | 'long' | 'email' | 'number'
  hasCharacterLimit?: boolean
  characterLimit?: number
  
  // Yes/No specific
  hasCustomLabels?: boolean
  yesNoLabels?: { yes?: string; no?: string }
  
  responses?: SurveyQuestionResponse[]
  createdAt?: Date
  updatedAt?: Date
}

export interface TargetAudience {
  type: TargetAudienceType
  groupIds?: string[]
  roleIds?: string[]
}

export interface SurveyQuestionOption {
  id: string
  text: string
  order: number
}

export interface SurveyResponse {
  id: string
  surveyId: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  submittedAt: Date
  questionResponses: SurveyQuestionResponse[]
}

export interface SurveyQuestionResponse {
  id: string
  responseId: string
  questionId: string
  value: any // JSON value - can be string, number, array, etc.
  textValue?: string
}

export interface SurveyTemplate {
  id: string
  churchId?: string
  createdBy?: string
  name: string
  description?: string
  category: string
  isSystemTemplate: boolean
  templateData: SurveyTemplateData
  createdAt: Date
  updatedAt: Date
}

export interface SurveyTemplateData {
  title: string
  description?: string
  questions: SurveyTemplateQuestion[]
  settings: SurveyTemplateSettings
}

export interface SurveyTemplateQuestion {
  type: QuestionType
  title: string
  description?: string
  required: boolean
  options?: SurveyQuestionOption[]
  minRating?: number
  maxRating?: number
  ratingLabels?: { min?: string; max?: string }
}

export interface SurveyTemplateSettings {
  isAnonymous: boolean
  allowMultipleResponses: boolean
  sendOnPublish: boolean
  sendReminders: boolean
  reminderDays: number[]
}

// Survey Analytics Types
export interface SurveyAnalytics {
  surveyId: string
  totalResponses: number
  completionRate: number
  averageCompletionTime?: number
  questionAnalytics: SurveyQuestionAnalytics[]
  demographicBreakdown?: SurveyDemographicBreakdown
}

export interface SurveyQuestionAnalytics {
  questionId: string
  questionTitle: string
  questionType: QuestionType
  totalResponses: number
  responseBreakdown: SurveyResponseBreakdown
}

export interface SurveyResponseBreakdown {
  // For multiple choice questions
  optionCounts?: { [optionId: string]: number }
  
  // For rating questions
  averageRating?: number
  ratingDistribution?: { [rating: number]: number }
  
  // For text questions
  textResponses?: string[]
  
  // For yes/no questions
  yesCount?: number
  noCount?: number
}

export interface SurveyDemographicBreakdown {
  byBranch?: { [branchId: string]: number }
  byGroup?: { [groupId: string]: number }
  byRole?: { [role: string]: number }
  byAge?: { [ageRange: string]: number }
}

// Survey Creation/Update Types
export interface CreateSurveyRequest {
  title: string
  description?: string
  questions: CreateSurveyQuestionRequest[]
  settings: CreateSurveySettingsRequest
}

export interface CreateSurveyQuestionRequest {
  type: QuestionType
  title: string
  description?: string
  required: boolean
  options?: Omit<SurveyQuestionOption, 'id'>[]
  minRating?: number
  maxRating?: number
  ratingLabels?: { min?: string; max?: string }
}

export interface CreateSurveySettingsRequest {
  isAnonymous: boolean
  allowMultipleResponses: boolean
  deadline?: Date
  targetAudience: TargetAudience
  sendOnPublish: boolean
  sendReminders: boolean
  reminderDays: number[]
  meetingId?: string
}

export interface SubmitSurveyResponseRequest {
  responses: SubmitSurveyQuestionResponseRequest[]
}

export interface SubmitSurveyQuestionResponseRequest {
  questionId: string
  value: any
  textValue?: string
}

// Survey Filters and Sorting
export interface SurveyFilters {
  status?: SurveyStatus[]
  createdBy?: string[]
  branchId?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  hasResponses?: boolean
}

export interface SurveySortOptions {
  field: 'title' | 'createdAt' | 'publishedAt' | 'deadline' | 'responseCount'
  direction: 'asc' | 'desc'
}

// Survey Permissions
export interface SurveyPermissions {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canViewResults: boolean
  canExportResults: boolean
  canManageTemplates: boolean
}