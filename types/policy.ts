export type RequiredPolicyType =
  | 'termsOfService'
  | 'privacyPolicy'
  | 'rentalAgreement'

export interface RequiredPolicy {
  id: number
  type: RequiredPolicyType
  title: string
  version: string
  body: string
  effectiveAt: string | null
}
