import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LivestreamCreator from '@/components/LivestreamCreator'

describe('LivestreamCreator Component', () => {
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()
  const renderCreator = () => render(<LivestreamCreator onSuccess={mockOnSuccess} onError={mockOnError} />)

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('Rendering', () => {
    it('should render the component with title', () => {
      renderCreator()

      expect(screen.getByText('Create New Livestream')).toBeInTheDocument()
    })

    it('should render all platform options', () => {
      renderCreator()

      expect(screen.getByText('Restream')).toBeInTheDocument()
      expect(screen.getByText('YouTube')).toBeInTheDocument()
      expect(screen.getByText('Facebook')).toBeInTheDocument()
      expect(screen.getByText('Instagram')).toBeInTheDocument()
    })

    it('should render form fields', () => {
      renderCreator()

      expect(screen.getByPlaceholderText(/Livestream Title/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Add details about this livestream/i)).toBeInTheDocument()
    })

    it('should render submit button', () => {
      renderCreator()

      expect(screen.getByRole('button', { name: /Create Livestream/i })).toBeInTheDocument()
    })
  })

  describe('Platform Selection', () => {
    it('should toggle platform selection', async () => {
      renderCreator()

      const youtubeButton = screen.getByText('YouTube').closest('button')
      expect(youtubeButton).toBeInTheDocument()

      fireEvent.click(youtubeButton!)
      await waitFor(() => {
        expect(screen.getByText('✓ Selected')).toBeInTheDocument()
      })
    })

    it('should allow multiple platform selection', async () => {
      renderCreator()

      const youtubeButton = screen.getByText('YouTube').closest('button')
      const facebookButton = screen.getByText('Facebook').closest('button')

      fireEvent.click(youtubeButton!)
      fireEvent.click(facebookButton!)

      await waitFor(() => {
        const selectedElements = screen.getAllByText('✓ Selected')
        expect(selectedElements.length).toBe(2)
      })
    })

    it('should deselect platform when clicked again', async () => {
      renderCreator()

      const youtubeButton = screen.getByText('YouTube').closest('button')

      fireEvent.click(youtubeButton!)
      await waitFor(() => {
        expect(screen.getByText('✓ Selected')).toBeInTheDocument()
      })

      fireEvent.click(youtubeButton!)
      await waitFor(() => {
        expect(screen.queryByText('✓ Selected')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should require title', async () => {
      renderCreator()

      const submitButton = screen.getByRole('button', { name: /Create Livestream/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Title is required')
      })
    })

    it('should require at least one platform', async () => {
      renderCreator()

      const titleInput = screen.getByPlaceholderText(/Livestream Title/i)
      fireEvent.change(titleInput, { target: { value: 'Test Livestream' } })

      const submitButton = screen.getByRole('button', { name: /Create Livestream/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Select at least one platform')
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'livestream-123' }),
      })
      global.fetch = mockFetch

      renderCreator()

      const titleInput = screen.getByPlaceholderText(/Livestream Title/i)
      fireEvent.change(titleInput, { target: { value: 'Test Livestream' } })

      const youtubeButton = screen.getByText('YouTube').closest('button')
      fireEvent.click(youtubeButton!)

      const submitButton = screen.getByRole('button', { name: /Create Livestream/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/livestreams',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('should call onSuccess with livestream ID', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'livestream-456' }),
      })
      global.fetch = mockFetch

      renderCreator()

      const titleInput = screen.getByPlaceholderText(/Livestream Title/i)
      fireEvent.change(titleInput, { target: { value: 'Test Livestream' } })

      const youtubeButton = screen.getByText('YouTube').closest('button')
      fireEvent.click(youtubeButton!)

      const submitButton = screen.getByRole('button', { name: /Create Livestream/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('livestream-456')
      })
    })

    it('should handle API errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'API Error' }),
      })
      global.fetch = mockFetch

      renderCreator()

      const titleInput = screen.getByPlaceholderText(/Livestream Title/i)
      fireEvent.change(titleInput, { target: { value: 'Test Livestream' } })

      const youtubeButton = screen.getByText('YouTube').closest('button')
      fireEvent.click(youtubeButton!)

      const submitButton = screen.getByRole('button', { name: /Create Livestream/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('API Error')
      })
    })
  })

  describe('Platform-Specific Settings', () => {
    const selectPlatform = async (label: string) => {
      renderCreator()
      const platformButton = screen.getByText(label).closest('button')
      fireEvent.click(platformButton!)
    }

    it('should show YouTube settings when YouTube is selected', async () => {
      await selectPlatform('YouTube')

      await waitFor(() => {
        expect(screen.getByText('YouTube Settings')).toBeInTheDocument()
      })
    })

    it('should show Facebook settings when Facebook is selected', async () => {
      await selectPlatform('Facebook')

      await waitFor(() => {
        expect(screen.getByText('Facebook Settings')).toBeInTheDocument()
      })
    })

    it('should show Instagram settings when Instagram is selected', async () => {
      await selectPlatform('Instagram')

      await waitFor(() => {
        expect(screen.getByText('Instagram Settings')).toBeInTheDocument()
      })
    })

    it('should show Restream settings when Restream is selected', async () => {
      await selectPlatform('Restream')

      await waitFor(() => {
        expect(screen.getByText('Restream Settings')).toBeInTheDocument()
      })
    })
  })

  describe('Form Reset', () => {
    it('should reset form after successful submission', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'livestream-789' }),
      })
      global.fetch = mockFetch

      renderCreator()

      const titleInput = screen.getByPlaceholderText(/Livestream Title/i) as HTMLInputElement
      fireEvent.change(titleInput, { target: { value: 'Test Livestream' } })

      const youtubeButton = screen.getByText('YouTube').closest('button')
      fireEvent.click(youtubeButton!)

      const submitButton = screen.getByRole('button', { name: /Create Livestream/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(titleInput.value).toBe('')
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      const mockFetch = vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ id: 'livestream-123' }),
                }),
              100
            )
          )
      )
      global.fetch = mockFetch

      renderCreator()

      const titleInput = screen.getByPlaceholderText(/Livestream Title/i)
      fireEvent.change(titleInput, { target: { value: 'Test Livestream' } })

      const youtubeButton = screen.getByText('YouTube').closest('button')
      fireEvent.click(youtubeButton!)

      const submitButton = screen.getByRole('button', { name: /Create Livestream/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Creating Livestream/i })).toBeInTheDocument()
      })
    })
  })
})
