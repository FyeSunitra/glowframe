import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type {
  AuthResult,
  AuthSession,
  LoginPayload,
  SignupPayload,
  VerifyOtpPayload,
  ChangePasswordPayload,
} from '@/types/auth'

let sessionRequest: Promise<ApiResponse<AuthSession>> | null = null

export const authService = {
  async signup(payload: SignupPayload): Promise<ApiResponse<AuthResult>> {
    try {
      const body = await api.post<ApiDataBody<AuthResult>>('/api/auth/signup', payload)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'สมัครสมาชิกไม่สำเร็จ')
    }
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<ApiResponse<AuthSession>> {
    sessionRequest = null
    try {
      const body = await api.post<ApiDataBody<AuthSession>>('/api/auth/verify', payload)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'ยืนยัน OTP ไม่สำเร็จ')
    }
  },

  async resendOtp(email: string): Promise<ApiResponse<null>> {
    try {
      await api.post<ApiDataBody<null>>('/api/auth/resend', { email })
      return ok(null)
    } catch (error) {
      return fail(error, 'ส่ง OTP ใหม่ไม่สำเร็จ')
    }
  },

  async login(payload: LoginPayload): Promise<ApiResponse<AuthSession>> {
    sessionRequest = null
    try {
      const body = await api.post<ApiDataBody<AuthSession>>('/api/auth/login', payload)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'เข้าสู่ระบบไม่สำเร็จ')
    }
  },

  async session(): Promise<ApiResponse<AuthSession>> {
    if (typeof window === 'undefined') return requestSession()
    if (!sessionRequest) {
      const pending = requestSession().finally(() => {
        if (sessionRequest === pending) sessionRequest = null
      })
      sessionRequest = pending
    }
    return sessionRequest
  },

  async logout(): Promise<ApiResponse<null>> {
    sessionRequest = null
    try {
      await api.post<ApiDataBody<null>>('/api/auth/logout')
      return ok(null)
    } catch (error) {
      return fail(error, 'ออกจากระบบไม่สำเร็จ')
    }
  },

  async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<null>> {
    try {
      await api.post<ApiDataBody<null>>('/api/auth/change-password', payload)
      return ok(null)
    } catch (error) {
      return fail(error, 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
    }
  },
}

async function requestSession(): Promise<ApiResponse<AuthSession>> {
    try {
      const body = await api.get<ApiDataBody<AuthSession>>('/api/auth/session', {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'ไม่พบเซสชัน')
    }
}
