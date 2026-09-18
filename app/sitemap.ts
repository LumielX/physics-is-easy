import type { MetadataRoute } from 'next';
import { getAllChapters } from '@/lib/content/registry';
import { getAllSimulators } from '@/lib/simulators/registry';
import { GRADES } from '@/lib/content/taxonomy';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://physics-is-easy.vercel.app';

/**
 * Generated from the content registry, so a new chapter appears in the sitemap
 * without anyone remembering to add it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/lessons`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/simulator`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/quiz`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/formulas`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/progress`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/settings`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ];

  for (const grade of GRADES) {
    entries.push({
      url: `${SITE_URL}/lessons/${grade.id}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    });
  }

  for (const chapter of getAllChapters()) {
    entries.push({
      url: `${SITE_URL}/lessons/${chapter.grade}/${chapter.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    });
    entries.push({
      url: `${SITE_URL}/quiz/${chapter.grade}-${chapter.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  for (const sim of getAllSimulators()) {
    entries.push({
      url: `${SITE_URL}/simulator/${sim.id}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
