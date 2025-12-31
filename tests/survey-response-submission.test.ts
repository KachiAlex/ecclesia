import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { SurveyValidation } from '@/lib/utils/survey-validation'
import { SurveyQuestion, QuestionType } from '@/types/survey'

describe('Survey Response Submission Validation - Property Tests', () => {
  // Property 4: Response submission validation
  it('should validate response submission according to question requirements', () => {
    fc.assert(
      fc.property(
        // Generate survey questions with various configurations
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            type: fc.constantFrom('multiple_choice', 'text', 'rating', 'yes_no') as fc.Arbitrary<QuestionType>,
            title: fc.string({ minLength: 1 }),
            required: fc.boolean(),
            order: fc.integer({ min: 0, max: 100 }),
            // Multiple choice options
            options: fc.option(fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 })),
            allowMultiple: fc.option(fc.boolean()),
            // Rating configuration
            minRating: fc.option(fc.integer({ min: 0, max: 5 })),
            maxRating: fc.option(fc.integer({ min: 1, max: 10 })),
            // Text configuration
            textType: fc.option(fc.constantFrom('short', 'long', 'email', 'number')),
            hasCharacterLimit: fc.option(fc.boolean()),
            characterLimit: fc.option(fc.integer({ min: 1, max: 1000 }))
          }),
          { minLength: 1, maxLength: 20 }
        ),
        // Generate responses for the questions
        fc.array(
          fc.record({
            questionId: fc.string({ minLength: 1 }),
            value: fc.oneof(
              fc.string(),
              fc.integer(),
              fc.array(fc.string()),
              fc.boolean(),
              fc.constant(null),
              fc.constant(undefined)
            )
          })
        ),
        (questions, responses) => {
          // Ensure response questionIds match question ids for valid test cases
          const validResponses = responses.map((response, index) => ({
            ...response,
            questionId: questions[index % questions.length]?.id || response.questionId
          }))

          const result = SurveyValidation.validateResponseSubmission(questions, validResponses)

          // Property: Validation result should be consistent with question requirements
          questions.forEach(question => {
            const response = validResponses.find(r => r.questionId === question.id)
            
            if (question.required && (!response || response.value === null || response.value === undefined || response.value === '')) {
              // Required questions without valid responses should cause validation to fail
              expect(result.isValid).toBe(false)
              expect(result.errors.some(error => 
                error.questionId === question.id && error.type === 'required'
              )).toBe(true)
            }

            if (response && response.value !== null && response.value !== undefined) {
              // Validate question-specific constraints
              switch (question.type) {
                case 'multiple_choice':
                  if (question.options && Array.isArray(response.value)) {
                    const invalidOptions = response.value.filter(val => 
                      !question.options!.includes(val)
                    )
                    if (invalidOptions.length > 0) {
                      expect(result.errors.some(error => 
                        error.questionId === question.id && error.type === 'invalid_option'
                      )).toBe(true)
                    }
                  }
                  break

                case 'rating':
                  if (typeof response.value === 'number') {
                    const min = question.minRating || 1
                    const max = question.maxRating || 5
                    if (response.value < min || response.value > max) {
                      expect(result.errors.some(error => 
                        error.questionId === question.id && error.type === 'out_of_range'
                      )).toBe(true)
                    }
                  }
                  break

                case 'text':
                  if (typeof response.value === 'string') {
                    if (question.textType === 'email') {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                      if (!emailRegex.test(response.value)) {
                        expect(result.errors.some(error => 
                          error.questionId === question.id && error.type === 'invalid_format'
                        )).toBe(true)
                      }
                    }
                    
                    if (question.hasCharacterLimit && question.characterLimit) {
                      if (response.value.length > question.characterLimit) {
                        expect(result.errors.some(error => 
                          error.questionId === question.id && error.type === 'character_limit_exceeded'
                        )).toBe(true)
                      }
                    }
                  }
                  break

                case 'yes_no':
                  if (typeof response.value !== 'boolean') {
                    expect(result.errors.some(error => 
                      error.questionId === question.id && error.type === 'invalid_type'
                    )).toBe(true)
                  }
                  break
              }
            }
          })

          // Property: If all required questions have valid responses and all constraints are met,
          // validation should pass
          const allRequiredAnswered = questions
            .filter(q => q.required)
            .every(q => {
              const response = validResponses.find(r => r.questionId === q.id)
              return response && response.value !== null && response.value !== undefined && response.value !== ''
            })

          const allConstraintsMet = questions.every(question => {
            const response = validResponses.find(r => r.questionId === question.id)
            if (!response || response.value === null || response.value === undefined) {
              return !question.required
            }

            // Check type-specific constraints
            switch (question.type) {
              case 'multiple_choice':
                if (question.options && Array.isArray(response.value)) {
                  return response.value.every(val => question.options!.includes(val))
                }
                return true

              case 'rating':
                if (typeof response.value === 'number') {
                  const min = question.minRating || 1
                  const max = question.maxRating || 5
                  return response.value >= min && response.value <= max
                }
                return true

              case 'text':
                if (typeof response.value === 'string') {
                  if (question.textType === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    if (!emailRegex.test(response.value)) return false
                  }
                  
                  if (question.hasCharacterLimit && question.characterLimit) {
                    if (response.value.length > question.characterLimit) return false
                  }
                }
                return true

              case 'yes_no':
                return typeof response.value === 'boolean'

              default:
                return true
            }
          })

          if (allRequiredAnswered && allConstraintsMet) {
            expect(result.isValid).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property: Response validation should handle edge cases consistently
  it('should handle edge cases in response validation consistently', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          type: fc.constantFrom('multiple_choice', 'text', 'rating', 'yes_no') as fc.Arbitrary<QuestionType>,
          title: fc.string({ minLength: 1 }),
          required: fc.boolean(),
          order: fc.integer({ min: 0 }),
          options: fc.option(fc.array(fc.string({ minLength: 1 }), { minLength: 1 })),
          minRating: fc.option(fc.integer({ min: 0, max: 5 })),
          maxRating: fc.option(fc.integer({ min: 1, max: 10 })),
          characterLimit: fc.option(fc.integer({ min: 1, max: 1000 }))
        }),
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.string({ maxLength: 0 }),
          fc.array(fc.string(), { maxLength: 0 })
        ),
        (question, emptyValue) => {
          const response = {
            questionId: question.id,
            value: emptyValue
          }

          const result = SurveyValidation.validateResponseSubmission([question], [response])

          // Property: Empty values should fail validation for required questions
          if (question.required) {
            expect(result.isValid).toBe(false)
            expect(result.errors.some(error => 
              error.questionId === question.id && error.type === 'required'
            )).toBe(true)
          } else {
            // Non-required questions with empty values should not cause validation errors
            const hasRequiredError = result.errors.some(error => 
              error.questionId === question.id && error.type === 'required'
            )
            expect(hasRequiredError).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property: Validation should be deterministic
  it('should produce deterministic validation results for identical inputs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            type: fc.constantFrom('multiple_choice', 'text', 'rating', 'yes_no') as fc.Arbitrary<QuestionType>,
            title: fc.string({ minLength: 1 }),
            required: fc.boolean(),
            order: fc.integer({ min: 0 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            questionId: fc.string({ minLength: 1 }),
            value: fc.oneof(fc.string(), fc.integer(), fc.boolean())
          })
        ),
        (questions, responses) => {
          const result1 = SurveyValidation.validateResponseSubmission(questions, responses)
          const result2 = SurveyValidation.validateResponseSubmission(questions, responses)

          // Property: Multiple calls with same input should produce identical results
          expect(result1.isValid).toBe(result2.isValid)
          expect(result1.errors).toEqual(result2.errors)
        }
      ),
      { numRuns: 100 }
    )
  })
})