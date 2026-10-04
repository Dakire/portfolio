import { Inbox } from 'lucide-react';

// État vide : explique pourquoi il n'y a rien à voir (plutôt qu'une zone blanche).
export default function EmptyState({ title, children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line-strong px-6 py-12 text-center">
      <span className="icon-tile h-12 w-12" aria-hidden="true">
        <Inbox className="h-6 w-6" />
      </span>
      <p className="text-lg font-semibold text-ink">{title}</p>
      <p className="max-w-md text-copy text-body">{children}</p>
    </div>
  );
}
