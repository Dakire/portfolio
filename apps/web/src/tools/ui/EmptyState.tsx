import { Inbox } from 'lucide-preact';
import type { ComponentChildren } from 'preact';

/** État vide : explique pourquoi il n'y a rien à voir (plutôt qu'une zone blanche). */
export default function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ComponentChildren;
}) {
  return (
    <div class="empty-state">
      <Inbox size={28} aria-hidden="true" />
      <p class="empty-title">{title}</p>
      <p>{children}</p>
    </div>
  );
}
