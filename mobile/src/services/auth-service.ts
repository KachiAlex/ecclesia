import { apiClient } from './api-client'
import { AuthResponse, LoginData, RegisterData, User } from '@types/index'

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const data: LoginData = { email, password }
      const response = await apiClient.post<AuthResponse>('/api/auth/login', data)
      
      // Store token
      await apiClient.setAuthToken(response.token)
      
      return response
    } catch (error) {
      throw error
    }
  }

  async register(churchName: string, email: string, password: string, plan: 'basic' | 'pro'): Promise<AuthResponse> {
    try {
      const data: RegisterData = { churchName, email, password, plan }
      const response = await apiClient.post<AuthResponse>('/api/auth/register', data)
      
      // Store token
      await apiClient.setAuthToken(response.token)
      
      return response
    } catch (error) {
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', {})
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      apiClient.clearToken()
    }
  }

  async getStoredToken(): Promise<string | null> {
    return await apiClient.getStoredToken()
  }

  async validateToken(): Promise<User | null> {
    try {
      const user = await apiClient.get<User>('/api/auth/me')
      return user
    } catch (error) {
      apiClient.clearToken()
      return null
    }
  }
}

export const authService = new AuthService()
