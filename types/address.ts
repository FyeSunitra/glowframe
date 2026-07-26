export interface Address {
  id: number
  label: string
  recipientName: string
  recipientPhone: string
  addressLine: string
  province: string
  district: string
  subdistrict: string
  postalCode: string
  landmark: string
  isDefault: boolean
  detail: string
}

export interface AddressPayload {
  label: string
  recipientName: string
  recipientPhone: string
  addressLine: string
  province: string
  district: string
  subdistrict: string
  postalCode: string
  landmark: string
  isDefault: boolean
}
