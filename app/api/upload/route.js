import { getCurrentUser } from '@/lib/auth/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/gif', 'image/jpeg', 'image/png', 'image/webp'])

const hasValidImageSignature = (bytes, contentType) => {
  if (contentType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }

  if (contentType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e
      && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a
      && bytes[6] === 0x1a && bytes[7] === 0x0a
  }

  if (contentType === 'image/gif') {
    return String.fromCharCode(...bytes.slice(0, 6)) === 'GIF87a'
      || String.fromCharCode(...bytes.slice(0, 6)) === 'GIF89a'
  }

  if (contentType === 'image/webp') {
    return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  }

  return false
}

export async function POST(req) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return Response.json(
        { error: 'Unauthorized: Please login first' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json(
        { error: 'A valid image file is required' },
        { status: 400 }
      )
    }

    if (!IMAGE_TYPES.has(file.type)) {
      return Response.json(
        { error: 'Only JPEG, JPG PNG, GIF, and WebP images are allowed' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: 'Images must be 5 MB or smaller' },
        { status: 413 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (!hasValidImageSignature(buffer, file.type)) {
      return Response.json(
        { error: 'The uploaded file is not a valid image' },
        { status: 400 }
      )
    }

    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    return Response.json({
      success: true,
      url: dataUrl,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
