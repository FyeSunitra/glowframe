export const EMAIL_TEMPLATE_VARIABLES: Record<string, string[]> = {
  booking_status_update: ['{{user_name}}', '{{booking_ref}}', '{{product_name}}', '{{rental_dates}}', '{{tracking_number}}', '{{rejection_reason}}', '{{damage_description}}', '{{damage_amount}}', '{{admin_decision_note}}', '{{action_url}}'],
  return_reminder: ['{{user_name}}', '{{booking_ref}}', '{{product_name}}', '{{action_url}}'],
}

export const EMAIL_TEMPLATE_SAMPLE_VARIABLES: Record<string, string> = {
  user_name: 'GlowFrame User',
  booking_ref: 'GF-2026-0001',
  product_name: 'Canon EOS R6',
  rental_dates: '10-12 September 2026',
  rejection_reason: 'The provided information could not be verified.',
  tracking_number: 'TH1234567890',
  amount: '1,250.00 THB',
  action_url: 'https://glowframe-red.vercel.app/my-rentals?booking=1',
}

export function renderEmailTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/{{\s*([a-z_]+)\s*}}/g, (placeholder, key: string) => variables[key] ?? placeholder)
}

export function renderEmailHtmlTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/{{\s*([a-z_]+)\s*}}/g, (placeholder, key: string) =>
    key in variables ? escapeHtml(variables[key]) : placeholder,
  )
}

export function createGlowframeEmailHtml({ title, bodyHtml, actionUrl }: { title: string; bodyHtml: string; actionUrl?: string | null }) {
  const cta = actionUrl
    ? `<p style="margin:28px 0 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;border-radius:999px;background:#e997aa;color:#3f2924;padding:12px 20px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none">View details</a></p>`
    : ''
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fbf5f4;color:#4c3630"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf5f4;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #eadbd7;border-radius:12px;overflow:hidden"><tr><td style="background:#4c3630;padding:22px 30px;font-family:Georgia,serif;color:#fcecef;font-size:26px;font-weight:700">GlowFrame</td></tr><tr><td style="padding:30px;font-family:Arial,sans-serif"><h1 style="margin:0 0 18px;color:#4c3630;font-size:22px;line-height:1.35">${escapeHtml(title)}</h1><div style="color:#654d46;font-size:15px;line-height:1.75">${bodyHtml}</div>${cta}</td></tr><tr><td style="border-top:1px solid #eadbd7;padding:18px 30px;font-family:Arial,sans-serif;color:#91766d;font-size:12px;line-height:1.6">This is an automated notification from GlowFrame.</td></tr></table></td></tr></table></body></html>`
}

export function htmlToPlainText(html: string) {
  return html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character)
}
