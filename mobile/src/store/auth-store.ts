import { create } from 'zustand'
import { User } from '@types/index'
import { authService } from '@services/auth-service'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (churchName: string, email: string, password: string, plan: 'basic' | 'pro') => Promise<void>
  logout: () => Promise<void>
  restoreToken: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login(email, password)
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  register: async (churchName: string, email: string, password: string, plan: 'basic' | 'pro') => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.register(churchName, email, password, plan)
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  restoreToken: async () => {
    set({ isLoading: true })
    try {
      const token = await authService.getStoredToken()
      if (token) {
        const user = await authService.validateToken()
        if (user) {
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          set({
            isAuthenticated: false,
            isLoading: false,
          })
        }
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } catch (error) {
      set({
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))
