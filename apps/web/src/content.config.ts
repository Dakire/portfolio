import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Articles : Markdown (src/content/blog/<slug>.md en français, src/content/blog/en/<slug>.md en anglais).
// Le slug est le nom du fichier : il fait partie de l'URL publique, ne le renommez pas sans redirection 301.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(10).max(120),
    description: z.string().min(50).max(300),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** Anglais seulement : slug de l'article français correspondant. */
    translationOf: z.string().optional(),
    /** Script autonome facultatif chargé par l'article (ex. filtre de tableau). */
    script: z.string().startsWith('/js/').optional(),
    category: z.enum(['messagerie', 'dns', 'migration', 'securite', 'poste-de-travail']),
    tags: z.array(z.string()).min(1).max(6),
  }),
});

export const collections = { blog };
