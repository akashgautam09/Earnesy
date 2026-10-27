import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const getCloudinaryPublicId = (url) => {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return null
  }

  try {
    const parsedUrl = new URL(url)
    const uploadMarker = '/upload/'
    const uploadIndex = parsedUrl.pathname.indexOf(uploadMarker)

    if (uploadIndex === -1) {
      return null
    }

    let publicPath = parsedUrl.pathname.slice(uploadIndex + uploadMarker.length)

    if (/^v\d+\//.test(publicPath)) {
      const versionSeparator = publicPath.indexOf('/')
      if (versionSeparator === -1) {
        return null
      }
      publicPath = publicPath.slice(versionSeparator + 1)
    }

    const extensionIndex = publicPath.lastIndexOf('.')
    if (extensionIndex === -1) {
      return null
    }

    return decodeURIComponent(publicPath.slice(0, extensionIndex))
  } catch {
    return null
  }
}

export default cloudinary
