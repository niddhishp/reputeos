import { MetadataRoute } from 'next';

/**
 * Robots.txt Configuration
 * 
 * Controls how search engines crawl and index the site.
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reputeos.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Admin and internal routes
          '/admin/',
          '/api/',
          '/_next/',
          '/private/',
          
          // App routes (require authentication)
          '/dashboard/',
          '/settings/',
          '/clients/',
          '/discover/',
          '/diagnose/',
          '/position/',
          '/express/',
          '/validate/',
          '/shield/',
          
          // Auth routes (redirect when logged in)
          '/login/',
          '/signup/',
          
          // Utility routes
          '/404/',
          '/500/',
        ],
      },
      {
        // Block AI crawlers from training on our content
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
      {
        // Allow Google full access (except protected routes)
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/settings/',
          '/clients/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
