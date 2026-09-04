import { api, fail, ok } from '@/lib/api'
import type { ApiDataBody, ApiListBody, ApiResponse } from '@/types/api'
import type {
  EmailTemplate,
  SendEmailTemplateTestPayload,
  UpdateEmailTemplatePayload,
} from '@/types/emailTemplate'

export const adminEmailTemplatesService = {
  async list(): Promise<ApiResponse<EmailTemplate[]>> {
    try {
      const body = await api.get<ApiListBody<EmailTemplate>>('/api/admin/comms/email-templates', {
        cache: 'no-store',
      })
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to load email templates.')
    }
  },

  async update(
    id: number,
    payload: UpdateEmailTemplatePayload,
  ): Promise<ApiResponse<EmailTemplate>> {
    try {
      const body = await api.patch<ApiDataBody<EmailTemplate>>(
        `/api/admin/comms/email-templates/${id}`,
        payload,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to save the email template.')
    }
  },

  async sendTest(
    id: number,
    payload: SendEmailTemplateTestPayload,
  ): Promise<ApiResponse<{ messageId: string }>> {
    try {
      const body = await api.post<ApiDataBody<{ messageId: string }>>(
        `/api/admin/comms/email-templates/${id}/test`,
        payload,
      )
      return ok(body.data)
    } catch (error) {
      return fail(error, 'Unable to send the test email.')
    }
  },
}
