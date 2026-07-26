import { redirect } from 'next/navigation'

export default function LegacyVerifyUploadPage() {
  redirect('/account/verify')
}
