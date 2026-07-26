export interface ProfileData {
  id: number
  displayName: string
  fullName: string
  email: string
  phone: string
  profileImageUrl: string | null
  emailVerified: boolean
  phoneVerified: boolean
  identityVerified: boolean
}

export interface UpdateProfilePayload {
  displayName: string
  fullName: string
  phone: string
}
