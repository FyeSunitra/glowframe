export interface EmailTemplate {
  id: number
  key: string
  nameTh: string
  nameEn: string
  subjectTh: string
  subjectEn: string
  bodyTh: string
  bodyEn: string
  recipientRoles: EmailTemplateRecipientRole[]
  isEnabled: boolean
  updatedAt: string
  updatedByName: string | null
  availableVariables: string[]
}

export type EmailTemplateRecipientRole = 'renter' | 'owner' | 'admin'

export interface UpdateEmailTemplatePayload {
  nameTh: string
  nameEn: string
  subjectTh: string
  subjectEn: string
  bodyTh: string
  bodyEn: string
  recipientRoles: EmailTemplateRecipientRole[]
  isEnabled: boolean
}

export interface SendEmailTemplateTestPayload {
  email: string
  locale: 'th' | 'en'
}
