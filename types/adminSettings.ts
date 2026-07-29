export interface FeeSettings {
  platformFee: number
  minPayout: number
  lateFeePerDay: number
}

export interface BookingSettings {
  minAdvanceDays: number
  paymentDeadlineHours: number
  ownerPrepDays: number
  cancellationWindowHours: number
}

export interface PlatformPaymentAccount {
  id?: number
  bankId: number
  bankCode?: string
  bankName?: string
  bankAbbreviation?: string
  accountName: string
  accountNumber: string
  active: boolean
  sortOrder?: number
}

export interface PaymentSettings {
  accounts: PlatformPaymentAccount[]
  paymentReviewHours: number
  payoutReviewDays: number
  supportedBanks: string
}

export interface AdminAccount {
  id: number
  name: string
  email: string
  role: 'admin'
}

export interface AdminSettings {
  fees: FeeSettings
  booking: BookingSettings
  payment: PaymentSettings
  admins: AdminAccount[]
}

export type AdminSettingsSection = 'fees' | 'booking' | 'payment' | 'addAdmin' | 'removeAdmin'

export interface AddAdminPayload {
  email: string
}

export interface AdminSettingsPatchPayload {
  section: AdminSettingsSection
  data?: Partial<FeeSettings & BookingSettings & PaymentSettings> | AddAdminPayload
  id?: number
}
