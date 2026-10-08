import type { ComponentChildren } from 'preact';

/** Zone à défilement horizontal (tableaux larges) : focalisable au clavier pour pouvoir la faire défiler (exigence d'accessibilité). */
export default function ScrollRegion({
  label,
  children,
}: {
  label: string;
  children: ComponentChildren;
}) {
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div role="region" aria-label={label} tabIndex={0} class="table-scroll">
      {children}
    </div>
  );
}
