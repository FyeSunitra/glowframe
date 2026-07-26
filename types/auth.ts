import type { User } from '@/types'

export interface SignupPayload {
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface VerifyOtpPayload {
  email: string
  token: string
}

export interface AuthResult {
  user: User | null
  requiresVerification: boolean
}

export interface AuthSession {
  user: User
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
