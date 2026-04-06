import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/profile', '/earnings', '/messages', '/api/'],
    },
    sitemap: 'https://duta.val.id/sitemap.xml',
  };
}
