export default function robots() {
  const baseUrl = (process.env.NEXT_PUBLIC_URL || 'https://earnesy.vercel.app').replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/explore', '/login', '/signup'],
        disallow: [
          '/api/',
          '/dashboard',
          '/profile',
          '/settings',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
