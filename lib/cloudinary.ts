import { v2 as cloudinary } from 'cloudinary'

export const PRODUCT_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const PRODUCT_VIDEO_MAX_BYTES = 100 * 1024 * 1024

export function getCloudinary() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ??
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey =
    process.env.CLOUDINARY_API_KEY ??
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not configured.')
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  return {
    client: cloudinary,
    cloudName,
    apiKey,
    apiSecret,
  }
}
