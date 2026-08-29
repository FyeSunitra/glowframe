export type PhotoboothFrameStyle = 'classic' | 'film' | 'minimal'

export type PhotoboothOutputType = 'photo' | 'gif'

export interface PhotoboothFrameColor {
  name: string
  value: string
}

export interface PhotoboothFrameSlot {
  index: number
  x: number
  y: number
  width: number
  height: number
}

export interface PhotoboothFrame {
  id: number
  nameTh: string
  nameEn: string
  descriptionTh?: string | null
  descriptionEn?: string | null
  canvasWidth: number
  canvasHeight: number
  aspectRatioLabel?: string
  frameCount: number
  slots: PhotoboothFrameSlot[]
  overlayUrl: string
  overlayPublicId: string
  originalFileName?: string | null
  price?: number
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface PhotoboothFrameInput {
  nameTh: string
  nameEn: string
  descriptionTh?: string | null
  descriptionEn?: string | null
  canvasWidth: number
  canvasHeight: number
  aspectRatioLabel?: string
  slots: PhotoboothFrameSlot[]
  overlayUrl: string
  overlayPublicId: string
  originalFileName?: string | null
  price?: number
  active?: boolean
  sortOrder?: number
}

export interface PhotoboothUploadSignature {
  cloudName: string
  apiKey: string
  timestamp: number
  folder: string
  signature: string
}

export interface PhotoboothFrameList {
  items: PhotoboothFrame[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
