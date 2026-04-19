// ============================================================
// AUTH SERVICE
// แยก logic auth ออกมาให้ component เรียกใช้ง่าย
// ============================================================

import api from './api'
import type { LoginPayload, AuthResponse } from '../types'

export const authService = {
  // POST /auth/login
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    return data
  },

  // POST /auth/signup
  signup: async (payload: LoginPayload & { email: string }): Promise<void> => {
    await api.post('/auth/signup', payload)
  },

  // Helper: เก็บ token ใน localStorage
  saveToken: (token: string): void => {
    localStorage.setItem('token', token)
  },

  // Helper: ลบ token (logout)
  clearToken: (): void => {
    localStorage.removeItem('token')
  },

  // Helper: อ่าน token
  getToken: (): string | null => {
    return localStorage.getItem('token')
  },

  // Helper: decode JWT payload (ไม่ต้องใช้ library)
  // JWT = header.payload.signature → decode base64 ส่วน payload
  decodeToken: (token: string) => {
    try {
      const payload = token.split('.')[1]
      return JSON.parse(atob(payload))
    } catch {
      return null
    }
  },

  // Helper: ตรวจว่า token ยังไม่หมดอายุ
  isTokenValid: (): boolean => {
    const token = localStorage.getItem('token')
    if (!token) return false
    try {
      const decoded = authService.decodeToken(token)
      // exp คือ Unix timestamp (seconds)
      return decoded?.exp * 1000 > Date.now()
    } catch {
      return false
    }
  },
}
