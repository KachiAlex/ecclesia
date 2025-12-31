import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { SurveyService } from '@/lib/services/survey-service'
import { Survey } from '@/types/survey'

describe('Survey Duplicate Response Prevention - Property Tests', () => {
  // Property 5: Duplicate response prevention
  it('should prevent duplicate responses based on survey settings', () => {
    fc.assert(
      fc.property(
        // Generate survey with allowMultipleResponses setting
        fc.record({
          id: fc.string({ minLength: 1 }),
          churchId: fc.string({ minLength: 1 }),
          createdBy: fc.string({ minLength: 1 }),
          title: fc.string({ minLength: 1 }),
          allowMultipleResponses: fc.boolean(),
          isAnonymous: fc.boolean(),
          status: fc.constantFrom('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'),
          targetAudience: fc.record({
            type: fc.constantFrom('all', 'groups', 'roles', 'custom'),
            groupIds: fc.array(fc.string()),
            roleIds: fc.array(fc.string())
          }),
          questions: fc.array(fc.record({
            id: fc.string({ minLength: 1 }),
            type: fc.constantFrom('multiple_choice', 'text', 'rating', 'yes_no'),
            title: fc.string({ minLength: 1 }),
            required: fc.boolean(),
            order: fc.integer({ min: 0 })
          }), { minLength: 1 }),
          createdAt: fc.date(),
          updatedAt: fc.date()
        }),
        // Generate user attempting to submit response
        fc.string({ minLength: 1 }),
        // Generate existing responses for the survey
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            surveyId: fc.string({ minLength: 1 }),
            userId: fc.option(fc.string({ minLength: 1 })),
            ipAddress: fc.option(fc.string()),
            submittedAt: fc.date(),
            questionResponses: fc.array(fc.record({
              questionId: fc.string({ minLength: 1 }),
              value: fc.oneof(fc.string(), fc.integer(), fc.boolean())
            }))
          }),
          { maxLength: 10 }
        ),
        (survey, userId, existingResponses) => {
          // Ensure existing responses belong to the survey
          const surveyResponses = existingResponses.map(response => ({
            ...response,
            surveyId: survey.id
          }))

          const surveyService = new SurveyService()

          // Property: Duplicate prevention should work based on survey settings
          const userHasExistingResponse = surveyResponses.some(response => 
            !survey.isAnonymous && response.userId === userId
          )

          const canSubmitResponse = surveyService.canUserSubmitResponse(
            survey as Survey,
            userId,
            surveyResponses
          )

          if (survey.allowMultipleResponses) {
            // If multiple responses are allowed, user should always be able to submit
            expect(canSubmitResponse).toBe(true)
          } else {
            // If multiple responses are not allowed
            if (survey.isAnonymous) {
              // For anonymous surveys, we can't track duplicates by user ID
              // so submission should be allowed (duplicate prevention by IP/session would be handled elsewhere)
              expect(canSubmitResponse).toBe(true)
            } else {
              // For non-anonymous surveys, prevent duplicates based on user ID
              if (userHasExistingResponse) {
                expect(canSubmitResponse).toBe(false)
              } else {
                expect(canSubmitResponse).toBe(true)
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property: Anonymous survey duplicate prevention should use alternative methods
  it('should handle duplicate prevention for anonymous surveys appropriately', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          churchId: fc.string({ minLength: 1 }),
          createdBy: fc.string({ minLength: 1 }),
          title: fc.string({ minLength: 1 }),
          allowMultipleResponses: fc.boolean(),
          isAnonymous: fc.constant(true), // Force anonymous
          status: fc.constantFrom('ACTIVE'),
          targetAudience: fc.record({
            type: fc.constantFrom('all'),
            groupIds: fc.array(fc.string()),
            roleIds: fc.array(fc.string())
          }),
          questions: fc.array(fc.record({
            id: fc.string({ minLength: 1 }),
            type: fc.constantFrom('text'),
            title: fc.string({ minLength: 1 }),
            required: fc.boolean(),
            order: fc.integer({ min: 0 })
          }), { minLength: 1 }),
          createdAt: fc.date(),
          updatedAt: fc.date()
        }),
        fc.string(), // IP address
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            surveyId: fc.string({ minLength: 1 }),
            userId: fc.constant(null), // Anonymous responses have no userId
            ipAddress: fc.string(),
            submittedAt: fc.date(),
            questionResponses: fc.array(fc.record({
              questionId: fc.string({ minLength: 1 }),
              value: fc.string()
            }))
          }),
          { maxLength: 5 }
        ),
        (survey, userIpAddress, existingResponses) => {
          const surveyResponses = existingResponses.map(response => ({
            ...response,
            surveyId: survey.id
          }))

          const surveyService = new SurveyService()

          // For anonymous surveys, duplicate prevention might use IP address
          const ipHasExistingResponse = surveyResponses.some(response => 
            response.ipAddress === userIpAddress
          )

          const canSubmitByIp = surveyService.canSubmitResponseByIp(
            survey as Survey,
            userIpAddress,
            surveyResponses
          )

          // Property: Anonymous survey duplicate prevention behavior
          if (survey.allowMultipleResponses) {
            expect(canSubmitByIp).toBe(true)
          } else {
            if (ipHasExistingResponse) {
              expect(canSubmitByIp).toBe(false)
            } else {
              expect(canSubmitByIp).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property: Duplicate prevention should be consistent across multiple checks
  it('should provide consistent duplicate prevention results', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          allowMultipleResponses: fc.boolean(),
          isAnonymous: fc.boolean(),
          status: fc.constantFrom('ACTIVE')
        }),
        fc.string({ minLength: 1 }), // userId
        fc.array(
          fc.record({
            userId: fc.option(fc.string({ minLength: 1 })),
            surveyId: fc.string({ minLength: 1 })
          }),
          { maxLength: 10 }
        ),
        (surveyConfig, userId, responses) => {
          const survey = {
            ...surveyConfig,
            churchId: 'test-church',
            createdBy: 'test-user',
            title: 'Test Survey',
            targetAudience: { type: 'all' as const },
            questions: [],
            createdAt: new Date(),
            updatedAt: new Date()
          } as Survey

          const surveyResponses = responses.map(r => ({
            ...r,
            id: `response-${Math.random()}`,
            surveyId: survey.id,
            submittedAt: new Date(),
            questionResponses: []
          }))

          const surveyService = new SurveyService()

          // Check multiple times - should be consistent
          const result1 = surveyService.canUserSubmitResponse(survey, userId, surveyResponses)
          const result2 = surveyService.canUserSubmitResponse(survey, userId, surveyResponses)
          const result3 = surveyService.canUserSubmitResponse(survey, userId, surveyResponses)

          // Property: Multiple checks should return the same result
          expect(result1).toBe(result2)
          expect(result2).toBe(result3)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property: Survey status should affect duplicate prevention
  it('should consider survey status in duplicate prevention logic', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          status: fc.constantFrom('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'),
          allowMultipleResponses: fc.boolean(),
          isAnonymous: fc.boolean()
        }),
        fc.string({ minLength: 1 }),
        (surveyConfig, userId) => {
          const survey = {
            ...surveyConfig,
            churchId: 'test-church',
            createdBy: 'test-user',
            title: 'Test Survey',
            targetAudience: { type: 'all' as const },
            questions: [],
            createdAt: new Date(),
            updatedAt: new Date()
          } as Survey

          const surveyService = new SurveyService()
          const canSubmit = surveyService.canUserSubmitResponse(survey, userId, [])

          // Property: Only ACTIVE surveys should accept responses
          if (survey.status === 'ACTIVE') {
            expect(canSubmit).toBe(true)
          } else {
            expect(canSubmit).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})