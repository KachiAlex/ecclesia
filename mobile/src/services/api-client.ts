import axios, { AxiosInstance, AxiosError } from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

class APIClient {
  private client: AxiosInstance
  private authToken: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken()
        }
        return Promise.reject(error)
      }
    )
  }

  async setAuthToken(token: string): Promise<void> {
    this.authToken = token
    try {
      await SecureStore.setItemAsync('auth_token', token)
    } catch (error) {
      console.error('Failed to store auth token:', error)
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      if (token) {
        this.authToken = token
      }
      return token
    } catch (error) {
      console.error('Failed to retrieve auth token:', error)
      return null
    }
  }

  clearToken(): void {
    this.authToken = null
    try {
      SecureStore.deleteItemAsync('auth_token')
    } catch (error) {
      console.error('Failed to clear auth token:', error)
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.client.put<T>(endpoint, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(endpoint)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message
      const status = error.response?.status
      return new Error(`API Error (${status}): ${message}`)
    }
    return error instanceof Error ? error : new Error('Unknown error occurred')
  }
}

export const apiClient = new APIClient()
