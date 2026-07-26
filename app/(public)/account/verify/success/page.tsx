import { redirect } from 'next/navigation'

export default function LegacyVerifySuccessPage() {
  redirect('/account/verify')
}
