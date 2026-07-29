import type { MenuLocale } from '@/lib/menuI18n'

export type PolicyDocumentType =
  | 'termsOfService'
  | 'privacyPolicy'
  | 'rentalAgreement'
  | 'listingPolicy'
  | 'paymentPolicy'
  | 'identityVerificationConsent'

export type RequiredPolicyType = Extract<
  PolicyDocumentType,
  'termsOfService' | 'privacyPolicy' | 'rentalAgreement' | 'paymentPolicy'
>

export type PolicyContext = 'signup' | 'payment'

export type PolicyDocumentStatus = 'draft' | 'current' | 'superseded' | 'archived'

export interface PolicyVersion {
  id: number
  version: string
  docType: PolicyDocumentType
  titleTh: string
  titleEn: string
  bodyTh: string
  bodyEn: string
  effectiveDate: string | null
  publishedAt: string | null
  usersAccepted: number
  totalUsers: number
  forceReconsent: boolean
  isRequired: boolean
  status: PolicyDocumentStatus
}

export interface CreatePolicyVersionPayload {
  version: string
  docType: PolicyDocumentType
  titleTh: string
  titleEn: string
  bodyTh: string
  bodyEn: string
  effectiveDate?: string
  isRequired: boolean
  requireReconsent: boolean
}

export type PolicyAction = 'publish' | 'force-reconsent' | 'archive'

export interface RequiredPolicy {
  id: number
  type: RequiredPolicyType
  title: string
  version: string
  body: string
  effectiveAt: string | null
}

export interface RequiredPolicyParams {
  locale: MenuLocale
  context?: PolicyContext
}
