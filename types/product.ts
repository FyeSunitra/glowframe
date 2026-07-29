export interface ProductAccessoryInput {
  accessoryId: number
  quantity: number
}

export interface ProductCustomAccessoryInput {
  clientId?: string
  name: string
  quantity: number
}

export type ProductMediaType = 'image' | 'video'

export interface ProductMediaInput {
  mediaType: ProductMediaType
  url: string
  publicId: string
}

export interface ProductMediaFiles {
  images: File[]
  video?: File | null
}

export interface ProductMediaUploadSignature {
  cloudName: string
  apiKey: string
  timestamp: number
  folder: string
  signature: string
}

export type OwnerProductAction = 'cancel_request' | 'hide' | 'reopen'

export interface CreateProductPayload {
  title: string
  categoryId: number
  brandId: number | null
  customBrandName: string | null
  model: string
  serialNumber?: string
  description?: string
  conditionNote?: string
  extraDetails?: string
  pricePerDay: number
  depositAmount: number
  pickupAddressId: number
  accessories: ProductAccessoryInput[]
  customAccessories: Array<Pick<ProductCustomAccessoryInput, 'name' | 'quantity'>>
  media: ProductMediaInput[]
}

export type UpdateOwnerProductPayload = CreateProductPayload
