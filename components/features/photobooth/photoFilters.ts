export type PhotoboothPhotoFilterId =
  | 'original'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'mono'

export interface PhotoboothPhotoFilter {
  id: PhotoboothPhotoFilterId
  previewGradient: string
}

export const PHOTO_FILTERS: PhotoboothPhotoFilter[] = [
  { id: 'original', previewGradient: 'linear-gradient(135deg, #f6d7c6 0%, #ffeccf 48%, #a4cce2 100%)' },
  { id: 'warm', previewGradient: 'linear-gradient(135deg, #e9a06d 0%, #ffd99b 52%, #b87955 100%)' },
  { id: 'cool', previewGradient: 'linear-gradient(135deg, #9fcde1 0%, #d9eef0 53%, #829ac9 100%)' },
  { id: 'vintage', previewGradient: 'linear-gradient(135deg, #a87a52 0%, #e7c48e 52%, #795441 100%)' },
  { id: 'mono', previewGradient: 'linear-gradient(135deg, #5f5b5a 0%, #e5e2df 50%, #9a9693 100%)' },
]
