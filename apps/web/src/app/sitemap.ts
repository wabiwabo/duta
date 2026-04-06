import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://duta.val.id';

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/campaigns`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];
}
