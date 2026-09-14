export type PhotoboothPhotoFilterId =
  | 'original'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'blush'
  | 'mono'

export interface PhotoboothPhotoFilter {
  id: PhotoboothPhotoFilterId
  canvasFilter: string
  previewGradient: string
}

export const PHOTO_FILTERS: PhotoboothPhotoFilter[] = [
  { id: 'original', canvasFilter: 'none', previewGradient: 'linear-gradient(135deg, #f6d7c6 0%, #ffeccf 48%, #a4cce2 100%)' },
  { id: 'warm', canvasFilter: 'brightness(1.04) saturate(1.16) sepia(0.14) hue-rotate(-5deg)', previewGradient: 'linear-gradient(135deg, #e9a06d 0%, #ffd99b 52%, #b87955 100%)' },
  { id: 'cool', canvasFilter: 'brightness(1.03) saturate(0.92) hue-rotate(8deg)', previewGradient: 'linear-gradient(135deg, #9fcde1 0%, #d9eef0 53%, #829ac9 100%)' },
  { id: 'vintage', canvasFilter: 'sepia(0.38) saturate(0.78) contrast(0.92) brightness(1.03)', previewGradient: 'linear-gradient(135deg, #a87a52 0%, #e7c48e 52%, #795441 100%)' },
  { id: 'mono', canvasFilter: 'grayscale(1) contrast(1.1) brightness(1.03)', previewGradient: 'linear-gradient(135deg, #5f5b5a 0%, #e5e2df 50%, #9a9693 100%)' },
]
