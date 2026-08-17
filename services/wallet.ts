import { api, fail, ok } from '@/lib/api'
import { buildListParams } from '@/lib/buildParams'
import type { ApiDataBody, ApiResponse } from '@/types/api'
import type {
  CreateWithdrawalPayload,
  SaveBankAccountPayload,
  UserBankAccount,
  WalletQuery,
  WalletSummary,
  WithdrawalRequest,
} from '@/types/wallet'

export const walletService = {
  async get(params: WalletQuery = {}): Promise<ApiResponse<WalletSummary>> {
    try {
      const body = await api.get<ApiDataBody<WalletSummary>>('/api/wallet', {
        params: buildListParams(params), cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load wallet.')
    }
  },
  async bankAccounts(): Promise<ApiResponse<UserBankAccount[]>> {
    try {
      const body = await api.get<ApiDataBody<UserBankAccount[]>>('/api/wallet/bank-accounts', { cache: 'no-store' })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load bank accounts.')
    }
  },
  async addBankAccount(payload: SaveBankAccountPayload): Promise<ApiResponse<UserBankAccount>> {
    try {
      const body = await api.post<ApiDataBody<UserBankAccount>>('/api/wallet/bank-accounts', payload)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to save bank account.')
    }
  },
  async updateBankAccount(id: number, payload: SaveBankAccountPayload): Promise<ApiResponse<UserBankAccount>> {
    try {
      const body = await api.patch<ApiDataBody<UserBankAccount>>(`/api/wallet/bank-accounts/${id}`, payload)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to update bank account.')
    }
  },
  async deleteBankAccount(id: number): Promise<ApiResponse<null>> {
    try {
      await api.delete(`/api/wallet/bank-accounts/${id}`)
      return ok(null)
    } catch (error) {
      return fail(error, 'Unable to delete bank account.')
    }
  },
  async withdraw(payload: CreateWithdrawalPayload): Promise<ApiResponse<WithdrawalRequest>> {
    try {
      const body = await api.post<ApiDataBody<WithdrawalRequest>>('/api/wallet/withdraw', payload)
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to submit withdrawal request.')
    }
  },
}
