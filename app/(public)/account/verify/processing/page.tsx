import { redirect } from 'next/navigation'

export default function LegacyVerifyProcessingPage() {
  redirect('/account/verify')
}
