// This API endpoint converts uploaded images into data URLs.

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.type || !file.type.startsWith('image/')) {
      return Response.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
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
