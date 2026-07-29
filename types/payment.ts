export interface PlatformReceivingAccount {
  id: number
  method: 'bank_transfer' | 'promptpay'
  bank: {
    id: number
    code: string
    abbreviation: string
    name: string
    logoUrl: string | null
  }
  accountName: string
  accountNumber: string
}
