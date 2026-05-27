import { poems } from '../data/poems'

const TR_MAP: Record<string, string> = {
  'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i',
  'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
  'â': 'a', 'Â': 'a', 'î': 'i', 'Î': 'i', 'û': 'u', 'Û': 'u',
}

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ]/g, (ch) => TR_MAP[ch] || ch)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface PoemSlug {
  id: number
  title: string
  slug: string
}

export const poemSlugs: PoemSlug[] = poems.map((p) => ({
  id: p.id,
  title: p.title,
  slug: toSlug(p.title),
}))

export function findPoemBySlug(slug: string): PoemSlug | undefined {
  return poemSlugs.find((p) => p.slug === slug)
}
