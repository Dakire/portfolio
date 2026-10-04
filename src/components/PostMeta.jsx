import { Clock } from 'lucide-react';
import { formatDate } from '../lib/format';

// Ligne « date · temps de lecture » des cartes d'articles (accueil et index du blog).
export default function PostMeta({ post, blog }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-meta text-link">
      <time dateTime={post.date}>{formatDate(post.date, blog.dateLocale)}</time>
      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {post.readingTime} {blog.min}</span>
    </p>
  );
}
