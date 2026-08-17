import { api, fail, ok } from '@/lib/api'
import { buildListParams } from '@/lib/buildParams'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type { AdminBankAccount, AdminBankAccountList, AdminPayout, AdminPayoutList, AdminPayoutQuery, ReviewPayoutPayload } from '@/types/adminPayout'

export const adminPayoutService = {
  async list(params: AdminPayoutQuery = {}): Promise<ApiResponse<AdminPayoutList>> {
    try {
      const body = await api.get<ApiDataBody<AdminPayoutList>>('/api/admin/payouts', { params: buildListParams(params), cache: 'no-store' })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load payouts.')
    }
  },
  async review(id: number, payload: ReviewPayoutPayload): Promise<ApiResponse<AdminPayout>> {
    try {
      const formData = new FormData()
      formData.set('action', payload.action)
      if (payload.action === 'approve') {
        formData.set('proof', payload.proof)
        if (payload.reference) formData.set('reference', payload.reference)
        if (payload.note) formData.set('note', payload.note)
      } else {
        formData.set('reason', payload.reason)
      }
      const body = await api.patch<ApiDataBody<AdminPayout>>(`/api/admin/payouts/${id}`, formData)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to review payout.')
    }
  },
  async bankAccounts(params: AdminPayoutQuery = {}): Promise<ApiResponse<AdminBankAccountList>> {
    try {
      const body = await api.get<ApiDataBody<AdminBankAccountList>>('/api/admin/payout-accounts', { params: buildListParams(params), cache: 'no-store' })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load payout accounts.')
    }
  },
  async reviewBankAccount(id: number, action: 'approve' | 'reject', reason?: string): Promise<ApiResponse<AdminBankAccount>> {
    try {
      const body = await api.patch<ApiDataBody<AdminBankAccount>>(`/api/admin/payout-accounts/${id}`, { action, reason })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to review payout account.')
    }
  },
  async revealBankAccount(id: number): Promise<ApiResponse<{ accountNumber: string }>> {
    try {
      const body = await api.get<ApiDataBody<{ accountNumber: string }>>(`/api/admin/payout-accounts/${id}/reveal`, { cache: 'no-store' })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to reveal account number.')
    }
  },
}
