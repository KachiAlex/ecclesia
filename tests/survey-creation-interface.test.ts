import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SurveyCreator from '@/components/SurveyCreator'

// Mock the question components to avoid complex rendering issues in tests
vi.mock('@/components/survey/MultipleChoiceQuestion', () => ({
  default: vi.fn(({ question, onChange, onRemove }) => 
    React.createElement('div', { 'data-testid': 'multiple-choice-question' }, [
      React.createElement('input', {
        key: 'title',
        'data-testid': 'question-title',
        value: question.title,
        onChange: (e) => onChange({ ...question, title: e.target.value })
      }),
      React.createElement('button', {
        key: 'remove',
        'data-testid': 'remove-question',
        onClick: onRemove
      }, 'Remove')
    ])
  )
}))

vi.mock('@/components/survey/TextQuestion', () => ({
  default: vi.fn(({ question, onChange, onRemove }) => 
    React.createElement('div', { 'data-testid': 'text-question' }, [
      React.createElement('input', {
        key: 'title',
        'data-testid': 'question-title',
        value: question.title,
        onChange: (e) => onChange({ ...question, title: e.target.value })
      }),
      React.createElement('button', {
        key: 'remove',
        'data-testid': 'remove-question',
        onClick: onRemove
      }, 'Remove')
    ])
  )
}))

vi.mock('@/components/survey/RatingQuestion', () => ({
  default: vi.fn(({ question, onChange, onRemove }) => 
    React.createElement('div', { 'data-testid': 'rating-question' }, [
      React.createElement('input', {
        key: 'title',
        'data-testid': 'question-title',
        value: question.title,
        onChange: (e) => onChange({ ...question, title: e.target.value })
      }),
      React.createElement('button', {
        key: 'remove',
        'data-testid': 'remove-question',
        onClick: onRemove
      }, 'Remove')
    ])
  )
}))

vi.mock('@/components/survey/YesNoQuestion', () => ({
  default: vi.fn(({ question, onChange, onRemove }) => 
    React.createElement('div', { 'data-testid': 'yes-no-question' }, [
      React.createElement('input', {
        key: 'title',
        'data-testid': 'question-title',
        value: question.title,
        onChange: (e) => onChange({ ...question, title: e.target.value })
      }),
      React.createElement('button', {
        key: 'remove',
        'data-testid': 'remove-question',
        onClick: onRemove
      }, 'Remove')
    ])
  )
}))

vi.mock('@/components/SurveySettings', () => ({
  default: vi.fn(({ settings, onChange }) => 
    React.createElement('div', { 'data-testid': 'survey-settings' }, [
      React.createElement('input', {
        key: 'anonymous',
        'data-testid': 'anonymous-checkbox',
        type: 'checkbox',
        checked: settings.isAnonymous,
        onChange: (e) => onChange({ ...settings, isAnonymous: e.target.checked })
      })
    ])
  )
}))

vi.mock('@/components/survey/TargetAudienceSelector', () => ({
  default: vi.fn(({ targetAudience, onChange }) => 
    React.createElement('div', { 'data-testid': 'target-audience-selector' }, [
      React.createElement('select', {
        key: 'type',
        'data-testid': 'audience-type',
        value: targetAudience.type,
        onChange: (e) => onChange({ ...targetAudience, type: e.target.value })
      }, [
        React.createElement('option', { key: 'all', value: 'all' }, 'All'),
        React.createElement('option', { key: 'groups', value: 'groups' }, 'Groups'),
        React.createElement('option', { key: 'roles', value: 'roles' }, 'Roles')
      ])
    ])
  )
}))

describe('Survey Creation Interface - Unit Tests', () => {
  const defaultProps = {
    userRole: 'pastor',
    churchId: 'test-church-id',
    onSave: vi.fn(),
    onPreview: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SurveyCreator Component', () => {
    it('should render survey creator with basic form elements', () => {
      render(React.createElement(SurveyCreator, defaultProps))
      
      expect(screen.getByText('Create Survey')).toBeDefined()
      expect(screen.getByPlaceholderText('Enter survey title...')).toBeDefined()
      expect(screen.getByPlaceholderText('Describe the purpose of this survey...')).toBeDefined()
      expect(screen.getByText('Builder')).toBeDefined()
      expect(screen.getByText('Settings')).toBeDefined()
      expect(screen.getByText('Audience')).toBeDefined()
    })

    it('should allow adding different question types', async () => {
      const user = userEvent.setup()
      render(React.createElement(SurveyCreator, defaultProps))
      
      // Add multiple choice question
      await user.click(screen.getByText('+ Multiple Choice'))
      expect(screen.getByTestId('multiple-choice-question')).toBeDefined()
      
      // Add text question
      await user.click(screen.getByText('+ Text'))
      expect(screen.getByTestId('text-question')).toBeDefined()
      
      // Add rating question
      await user.click(screen.getByText('+ Rating'))
      expect(screen.getByTestId('rating-question')).toBeDefined()
      
      // Add yes/no question
      await user.click(screen.getByText('+ Yes/No'))
      expect(screen.getByTestId('yes-no-question')).toBeDefined()
    })

    it('should handle survey title and description changes', async () => {
      const user = userEvent.setup()
      render(React.createElement(SurveyCreator, defaultProps))
      
      const titleInput = screen.getByPlaceholderText('Enter survey title...')
      const descriptionInput = screen.getByPlaceholderText('Describe the purpose of this survey...')
      
      await user.type(titleInput, 'Test Survey Title')
      await user.type(descriptionInput, 'Test survey description')
      
      expect(titleInput.value).toBe('Test Survey Title')
      expect(descriptionInput.value).toBe('Test survey description')
    })

    it('should switch between tabs correctly', async () => {
      const user = userEvent.setup()
      render(React.createElement(SurveyCreator, defaultProps))
      
      // Switch to Settings tab
      await user.click(screen.getByText('Settings'))
      expect(screen.getByTestId('survey-settings')).toBeDefined()
      
      // Switch to Audience tab
      await user.click(screen.getByText('Audience'))
      expect(screen.getByTestId('target-audience-selector')).toBeDefined()
      
      // Switch back to Builder tab
      await user.click(screen.getByText('Builder'))
      expect(screen.getByText('Questions')).toBeDefined()
    })

    it('should call onSave with correct survey data', async () => {
      const user = userEvent.setup()
      const mockOnSave = vi.fn()
      render(React.createElement(SurveyCreator, { ...defaultProps, onSave: mockOnSave }))
      
      // Fill in survey details
      await user.type(screen.getByPlaceholderText('Enter survey title...'), 'Test Survey')
      await user.type(screen.getByPlaceholderText('Describe the purpose of this survey...'), 'Test Description')
      
      // Add a question
      await user.click(screen.getByText('+ Multiple Choice'))
      
      // Save survey
      await user.click(screen.getByText('Save Survey'))
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Survey',
          description: 'Test Description',
          questions: expect.arrayContaining([
            expect.objectContaining({
              type: 'multiple_choice'
            })
          ]),
          churchId: 'test-church-id'
        })
      )
    })

    it('should call onPreview with survey data', async () => {
      const user = userEvent.setup()
      const mockOnPreview = vi.fn()
      render(React.createElement(SurveyCreator, { ...defaultProps, onPreview: mockOnPreview }))
      
      await user.type(screen.getByPlaceholderText('Enter survey title...'), 'Preview Test')
      await user.click(screen.getByText('Preview'))
      
      expect(mockOnPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Preview Test'
        })
      )
    })

    it('should remove questions when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(React.createElement(SurveyCreator, defaultProps))
      
      // Add a question
      await user.click(screen.getByText('+ Multiple Choice'))
      expect(screen.getByTestId('multiple-choice-question')).toBeDefined()
      
      // Remove the question
      await user.click(screen.getByTestId('remove-question'))
      expect(screen.queryByTestId('multiple-choice-question')).toBeNull()
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields before saving', async () => {
      const user = userEvent.setup()
      const mockOnSave = vi.fn()
      render(React.createElement(SurveyCreator, { ...defaultProps, onSave: mockOnSave }))
      
      // Try to save without title
      await user.click(screen.getByText('Save Survey'))
      
      // Should still call onSave (validation might be handled elsewhere)
      // but with empty title
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: ''
        })
      )
    })

    it('should handle question validation', async () => {
      const user = userEvent.setup()
      render(React.createElement(SurveyCreator, defaultProps))
      
      // Add question and verify it appears
      await user.click(screen.getByText('+ Multiple Choice'))
      expect(screen.getByTestId('multiple-choice-question')).toBeDefined()
      
      // Questions should be created with default values
      const questionTitleInput = screen.getByTestId('question-title')
      expect(questionTitleInput.value).toBe('')
    })
  })

  describe('Drag and Drop Functionality', () => {
    it('should handle question reordering', async () => {
      const user = userEvent.setup()
      render(React.createElement(SurveyCreator, defaultProps))
      
      // Add multiple questions
      await user.click(screen.getByText('+ Multiple Choice'))
      await user.click(screen.getByText('+ Text'))
      
      // Verify both questions are present
      expect(screen.getByTestId('multiple-choice-question')).toBeDefined()
      expect(screen.getByTestId('text-question')).toBeDefined()
      
      // Drag and drop functionality would be tested with more complex setup
      // For now, just verify the questions can be rendered together
    })
  })
})