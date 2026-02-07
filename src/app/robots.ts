import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/submissions', // Prevent scraping of public submissions
          '/login',
          '/admin',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://susbase.com/sitemap.xml', // Update with actual domain
  }
}
