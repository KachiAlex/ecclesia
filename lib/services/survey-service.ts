import { PrismaClient } from '@prisma/client'
import type {
  Survey,
  SurveyQuestion,
  SurveyResponse,
  SurveyTemplate,
  CreateSurveyRequest,
  SubmitSurveyResponseRequest,
  SurveyFilters,
  SurveySortOptions,
  SurveyPermissions,
  SurveyStatus,
  TargetAudienceType
} from '@/types/survey'

const prisma = new PrismaClient()

export class SurveyService {
  /**
   * Create a new survey
   */
  static async createSurvey(
    churchId: string,
    createdBy: string,
    data: CreateSurveyRequest
  ): Promise<Survey> {
    const survey = await prisma.survey.create({
      data: {
        churchId,
        createdBy,
        title: data.title,
        description: data.description,
        isAnonymous: data.settings.isAnonymous,
        allowMultipleResponses: data.settings.allowMultipleResponses,
        deadline: data.settings.deadline,
        targetAudienceType: data.settings.targetAudienceType,
        targetBranchIds: data.settings.targetBranchIds || [],
        targetGroupIds: data.settings.targetGroupIds || [],
        targetUserIds: data.settings.targetUserIds || [],
        sendOnPublish: data.settings.sendOnPublish,
        sendReminders: data.settings.sendReminders,
        reminderDays: data.settings.reminderDays,
        meetingId: data.settings.meetingId,
        questions: {
          create: data.questions.map((question, index) => ({
            type: question.type,
            title: question.title,
            description: question.description,
            required: question.required,
            order: index,
            options: question.options ? question.options : undefined,
            minRating: question.minRating,
            maxRating: question.maxRating,
            ratingLabels: question.ratingLabels ? question.ratingLabels : undefined,
          }))
        }
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return this.transformSurveyFromPrisma(survey)
  }

  /**
   * Get survey by ID
   */
  static async getSurveyById(surveyId: string, userId?: string): Promise<Survey | null> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        responses: userId ? {
          where: { userId },
          include: {
            questionResponses: true
          }
        } : false
      }
    })

    if (!survey) return null
    return this.transformSurveyFromPrisma(survey)
  }

  /**
   * Get surveys for a user (filtered by permissions and target audience)
   */
  static async getSurveysForUser(
    userId: string,
    churchId: string,
    filters?: SurveyFilters,
    sort?: SurveySortOptions
  ): Promise<Survey[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        groups: {
          select: { groupId: true }
        }
      }
    })

    if (!user) return []

    const userGroupIds = user.groups.map((g: { groupId: string }) => g.groupId)

    const whereClause: any = {
      churchId,
      status: filters?.status ? { in: filters.status } : 'ACTIVE',
      OR: [
        { targetAudienceType: 'ALL' },
        {
          targetAudienceType: 'BRANCH',
          targetBranchIds: { has: user.branchId }
        },
        {
          targetAudienceType: 'GROUP',
          targetGroupIds: { hasSome: userGroupIds }
        },
        {
          targetAudienceType: 'CUSTOM',
          targetUserIds: { has: userId }
        }
      ]
    }

    if (filters?.createdBy?.length) {
      whereClause.createdBy = { in: filters.createdBy }
    }

    if (filters?.dateRange) {
      whereClause.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      }
    }

    const orderBy: any = {}
    if (sort?.field) {
      orderBy[sort.field] = sort.direction
    } else {
      orderBy.createdAt = 'desc'
    }

    const surveys = await prisma.survey.findMany({
      where: whereClause,
      orderBy,
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: { responses: true }
        }
      }
    })

    return surveys.map(survey => this.transformSurveyFromPrisma(survey))
  }

  /**
   * Get surveys created by a user
   */
  static async getSurveysByCreator(
    creatorId: string,
    churchId: string,
    filters?: SurveyFilters
  ): Promise<Survey[]> {
    const whereClause: any = {
      churchId,
      createdBy: creatorId
    }

    if (filters?.status?.length) {
      whereClause.status = { in: filters.status }
    }

    if (filters?.dateRange) {
      whereClause.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      }
    }

    const surveys = await prisma.survey.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: { responses: true }
        }
      }
    })

    return surveys.map(survey => this.transformSurveyFromPrisma(survey))
  }

  /**
   * Update survey
   */
  static async updateSurvey(
    surveyId: string,
    userId: string,
    data: Partial<CreateSurveyRequest>
  ): Promise<Survey | null> {
    // Check if user can edit this survey
    const existingSurvey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { createdBy: true, status: true }
    })

    if (!existingSurvey || existingSurvey.createdBy !== userId) {
      throw new Error('Unauthorized to edit this survey')
    }

    if (existingSurvey.status === 'ACTIVE') {
      throw new Error('Cannot edit active survey')
    }

    const updateData: any = {}
    
    if (data.title) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    
    if (data.settings) {
      if (data.settings.isAnonymous !== undefined) updateData.isAnonymous = data.settings.isAnonymous
      if (data.settings.allowMultipleResponses !== undefined) updateData.allowMultipleResponses = data.settings.allowMultipleResponses
      if (data.settings.deadline !== undefined) updateData.deadline = data.settings.deadline
      if (data.settings.targetAudienceType) updateData.targetAudienceType = data.settings.targetAudienceType
      if (data.settings.targetBranchIds) updateData.targetBranchIds = data.settings.targetBranchIds
      if (data.settings.targetGroupIds) updateData.targetGroupIds = data.settings.targetGroupIds
      if (data.settings.targetUserIds) updateData.targetUserIds = data.settings.targetUserIds
      if (data.settings.sendOnPublish !== undefined) updateData.sendOnPublish = data.settings.sendOnPublish
      if (data.settings.sendReminders !== undefined) updateData.sendReminders = data.settings.sendReminders
      if (data.settings.reminderDays) updateData.reminderDays = data.settings.reminderDays
      if (data.settings.meetingId !== undefined) updateData.meetingId = data.settings.meetingId
    }

    const survey = await prisma.survey.update({
      where: { id: surveyId },
      data: updateData,
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return this.transformSurveyFromPrisma(survey)
  }

  /**
   * Publish survey (change status to ACTIVE)
   */
  static async publishSurvey(surveyId: string, userId: string): Promise<Survey | null> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { createdBy: true, status: true }
    })

    if (!survey || survey.createdBy !== userId) {
      throw new Error('Unauthorized to publish this survey')
    }

    if (survey.status !== 'DRAFT') {
      throw new Error('Only draft surveys can be published')
    }

    const updatedSurvey = await prisma.survey.update({
      where: { id: surveyId },
      data: {
        status: 'ACTIVE',
        publishedAt: new Date()
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return this.transformSurveyFromPrisma(updatedSurvey)
  }

  /**
   * Close survey (change status to CLOSED)
   */
  static async closeSurvey(surveyId: string, userId: string): Promise<Survey | null> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { createdBy: true, status: true }
    })

    if (!survey || survey.createdBy !== userId) {
      throw new Error('Unauthorized to close this survey')
    }

    if (survey.status !== 'ACTIVE') {
      throw new Error('Only active surveys can be closed')
    }

    const updatedSurvey = await prisma.survey.update({
      where: { id: surveyId },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return this.transformSurveyFromPrisma(updatedSurvey)
  }

  /**
   * Submit survey response
   */
  static async submitResponse(
    surveyId: string,
    userId: string | null,
    data: SubmitSurveyResponseRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SurveyResponse> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: true,
        responses: userId ? { where: { userId } } : false
      }
    })

    if (!survey) {
      throw new Error('Survey not found')
    }

    if (survey.status !== 'ACTIVE') {
      throw new Error('Survey is not active')
    }

    if (survey.deadline && new Date() > survey.deadline) {
      throw new Error('Survey deadline has passed')
    }

    // Check for duplicate responses
    if (!survey.allowMultipleResponses && userId && survey.responses && survey.responses.length > 0) {
      throw new Error('You have already responded to this survey')
    }

    // Validate required questions
    const requiredQuestions = survey.questions.filter(q => q.required)
    for (const question of requiredQuestions) {
      const response = data.responses.find(r => r.questionId === question.id)
      if (!response || response.value === null || response.value === undefined || response.value === '') {
        throw new Error(`Response required for question: ${question.title}`)
      }
    }

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId,
        userId: survey.isAnonymous ? null : userId,
        ipAddress,
        userAgent,
        questionResponses: {
          create: data.responses.map(r => ({
            questionId: r.questionId,
            value: r.value,
            textValue: r.textValue
          }))
        }
      },
      include: {
        questionResponses: {
          include: {
            question: true
          }
        }
      }
    })

    return this.transformResponseFromPrisma(response)
  }

  /**
   * Get survey responses (for analytics)
   */
  static async getSurveyResponses(
    surveyId: string,
    userId: string
  ): Promise<SurveyResponse[]> {
    // Check if user can view responses
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { createdBy: true, churchId: true }
    })

    if (!survey || survey.createdBy !== userId) {
      throw new Error('Unauthorized to view survey responses')
    }

    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId },
      include: {
        questionResponses: {
          include: {
            question: true
          }
        },
        user: survey ? {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        } : false
      },
      orderBy: { submittedAt: 'desc' }
    })

    return responses.map(response => this.transformResponseFromPrisma(response))
  }

  /**
   * Delete survey
   */
  static async deleteSurvey(surveyId: string, userId: string): Promise<void> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { createdBy: true, status: true }
    })

    if (!survey || survey.createdBy !== userId) {
      throw new Error('Unauthorized to delete this survey')
    }

    if (survey.status === 'ACTIVE') {
      throw new Error('Cannot delete active survey. Close it first.')
    }

    await prisma.survey.delete({
      where: { id: surveyId }
    })
  }

  /**
   * Check if user can access survey
   */
  static async canUserAccessSurvey(surveyId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        groups: {
          select: { groupId: true }
        }
      }
    })

    if (!user) return false

    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: {
        status: true,
        targetAudienceType: true,
        targetBranchIds: true,
        targetGroupIds: true,
        targetUserIds: true
      }
    })

    if (!survey || survey.status !== 'ACTIVE') return false

    return this.isUserInTargetAudience(survey, user)
  }

  /**
   * Get user permissions for surveys
   */
  static getUserPermissions(userRole: string): SurveyPermissions {
    const canCreate = ['ADMIN', 'SUPER_ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'LEADER'].includes(userRole)
    const canManageAll = ['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)

    return {
      canCreate,
      canEdit: canCreate,
      canDelete: canCreate,
      canViewResults: canCreate,
      canExportResults: canCreate,
      canManageTemplates: canManageAll
    }
  }

  /**
   * Check if user can submit response to survey
   */
  canUserSubmitResponse(survey: Survey, userId: string, existingResponses: SurveyResponse[]): boolean {
    // Check if survey is active
    if (survey.status !== 'ACTIVE') {
      return false
    }

    // Check if survey has deadline and it has passed
    if (survey.deadline && new Date() > survey.deadline) {
      return false
    }

    // If multiple responses are allowed, user can always submit
    if (survey.allowMultipleResponses) {
      return true
    }

    // For non-anonymous surveys, check if user already has a response
    if (!survey.isAnonymous) {
      const userHasResponse = existingResponses.some(response => response.userId === userId)
      return !userHasResponse
    }

    // For anonymous surveys, we can't prevent duplicates by user ID
    // This would typically be handled by IP address or session tracking
    return true
  }

  /**
   * Check if IP address can submit response (for anonymous surveys)
   */
  canSubmitResponseByIp(survey: Survey, ipAddress: string, existingResponses: SurveyResponse[]): boolean {
    // Check if survey is active
    if (survey.status !== 'ACTIVE') {
      return false
    }

    // If multiple responses are allowed, IP can always submit
    if (survey.allowMultipleResponses) {
      return true
    }

    // Check if IP already has a response
    const ipHasResponse = existingResponses.some(response => response.ipAddress === ipAddress)
    return !ipHasResponse
  }

  /**
   * Helper: Check if user is in target audience
   */
  private static isUserInTargetAudience(survey: any, user: any): boolean {
    const userGroupIds = user.groups?.map((g: any) => g.groupId) || []

    switch (survey.targetAudienceType) {
      case 'ALL':
        return true
      case 'BRANCH':
        return survey.targetBranchIds.includes(user.branchId)
      case 'GROUP':
        return survey.targetGroupIds.some((groupId: string) => userGroupIds.includes(groupId))
      case 'CUSTOM':
        return survey.targetUserIds.includes(user.id)
      default:
        return false
    }
  }

  /**
   * Helper: Transform Prisma survey to our Survey type
   */
  private static transformSurveyFromPrisma(survey: any): Survey {
    return {
      id: survey.id,
      churchId: survey.churchId,
      branchId: survey.branchId,
      createdBy: survey.createdBy,
      title: survey.title,
      description: survey.description,
      status: survey.status as SurveyStatus,
      isAnonymous: survey.isAnonymous,
      allowMultipleResponses: survey.allowMultipleResponses,
      deadline: survey.deadline,
      targetAudience: {
        type: survey.targetAudienceType as TargetAudienceType,
        groupIds: survey.targetGroupIds,
        roleIds: survey.targetUserIds // Note: using targetUserIds for roleIds
      },
      sendOnPublish: survey.sendOnPublish,
      sendReminders: survey.sendReminders,
      reminderDays: survey.reminderDays,
      meetingId: survey.meetingId,
      questions: survey.questions?.map((q: any) => ({
        id: q.id,
        surveyId: q.surveyId,
        type: q.type,
        title: q.title,
        description: q.description,
        required: q.required,
        order: q.order,
        options: q.options || undefined,
        minRating: q.minRating,
        maxRating: q.maxRating,
        ratingLabels: q.ratingLabels || undefined,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt
      })) || [],
      responses: survey.responses?.map((r: any) => this.transformResponseFromPrisma(r)) || [],
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      publishedAt: survey.publishedAt,
      closedAt: survey.closedAt
    }
  }

  /**
   * Helper: Transform Prisma response to our SurveyResponse type
   */
  private static transformResponseFromPrisma(response: any): SurveyResponse {
    return {
      id: response.id,
      surveyId: response.surveyId,
      userId: response.userId,
      ipAddress: response.ipAddress,
      userAgent: response.userAgent,
      submittedAt: response.submittedAt,
      questionResponses: response.questionResponses?.map((qr: any) => ({
        id: qr.id,
        responseId: qr.responseId,
        questionId: qr.questionId,
        value: qr.value,
        textValue: qr.textValue
      })) || []
    }
  }
}