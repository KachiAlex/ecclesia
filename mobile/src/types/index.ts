export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MEMBER' | 'LEADER' | 'PASTOR' | 'BRANCH_ADMIN'
  churchId: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}

export interface RegisterData {
  churchName: string
  email: string
  password: string
  plan: 'basic' | 'pro'
}

export interface LoginData {
  email: string
  password: string
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}
