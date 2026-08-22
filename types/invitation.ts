// Member Invitation System Types

export type FormFieldType = 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'date' | 'textarea'

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'pattern'
  value?: string | number
  message: string
}

export interface ConditionalLogic {
  dependsOn: string // field id
  condition: 'equals' | 'contains' | 'not_equals'
  value: string
  action: 'show' | 'hide' | 'require'
}

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  required: boolean
  validation?: ValidationRule[]
  options?: string[] // for select fields
  conditional?: ConditionalLogic
}

export interface ChurchBranding {
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  customCss?: string
}

export interface FormSettings {
  requireApproval: boolean
  autoAssignRole: string // UserRole enum value
  autoAssignDepartment?: string
  autoAssignBranch?: string
  enableEmailVerification: boolean
  enableCaptcha: boolean
  allowDuplicateEmails: boolean
  customSuccessMessage?: string
  redirectUrl?: string
  notificationEmails: string[]
}

export interface InvitationForm {
  id: string
  churchId: string
  name: string
  description?: string
  fields: FormField[]
  branding?: ChurchBranding
  settings: FormSettings
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface InvitationLink {
  id: string
  formId: string
  churchId: string
  token: string
  maxUses?: number
  currentUses: number
  expiresAt?: Date
  isActive: boolean
  createdBy: string
  createdAt: Date
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface RegistrationSubmission {
  id: string
  linkId: string
  formId: string
  churchId: string
  formData: Record<string, any>
  status: SubmissionStatus
  ipAddress?: string
  userAgent?: string
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  rejectionReason?: string
  createdUserId?: string
}

export interface InvitationLinkAccess {
  id: string
  linkId: string
  ipAddress?: string
  userAgent?: string
  accessedAt: Date
}

// API Request/Response Types
export interface CreateInvitationFormRequest {
  name: string
  description?: string
  fields: FormField[]
  branding?: ChurchBranding
  settings: FormSettings
}

export interface UpdateInvitationFormRequest extends Partial<CreateInvitationFormRequest> {
  id: string
}

export interface CreateInvitationLinkRequest {
  formId: string
  maxUses?: number
  expiresAt?: Date
}

export interface UpdateInvitationLinkRequest {
  maxUses?: number
  expiresAt?: Date
  isActive?: boolean
}

export interface SubmitRegistrationRequest {
  formData: Record<string, any>
}

export interface ApproveSubmissionRequest {
  submissionId: string
}

export interface RejectSubmissionRequest {
  submissionId: string
  reason: string
}

// Analytics Types
export interface InvitationAnalytics {
  totalForms: number
  totalLinks: number
  totalSubmissions: number
  pendingSubmissions: number
  approvedSubmissions: number
  rejectedSubmissions: number
  conversionRate: number
  topPerformingForms: Array<{
    formId: string
    formName: string
    submissions: number
    conversionRate: number
  }>
  recentActivity: Array<{
    type: 'form_created' | 'link_generated' | 'submission_received' | 'submission_approved' | 'submission_rejected'
    timestamp: Date
    details: Record<string, any>
  }>
}

export interface LinkAnalytics {
  linkId: string
  totalAccesses: number
  uniqueAccesses: number
  submissions: number
  conversionRate: number
  accessHistory: Array<{
    date: string
    accesses: number
    submissions: number
  }>
}

// Form Builder Types
export interface FormBuilderState {
  fields: FormField[]
  settings: FormSettings
  branding: ChurchBranding
  preview: boolean
}

export interface FieldPaletteItem {
  type: FormFieldType
  label: string
  icon: string
  description: string
  defaultConfig: Partial<FormField>
}

// Validation Types
export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
}

export interface FieldValidationResult {
  isValid: boolean
  errors: string[]
}

// Security Types
export interface SecurityEvent {
  type: 'rate_limit_exceeded' | 'suspicious_activity' | 'invalid_token' | 'expired_link'
  linkId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  details: Record<string, any>
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests: boolean
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>