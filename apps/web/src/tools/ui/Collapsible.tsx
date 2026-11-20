import type { ComponentChildren } from 'preact';

interface Props {
  title: string;
  /** Ouverte au premier affichage ; ensuite l'état appartient au navigateur (clavier : Entrée ou Espace sur le titre). */
  defaultOpen?: boolean;
  children: ComponentChildren;
}

/** Section repliable native (<details>) : accessible au clavier et aux lecteurs d'écran sans JavaScript de gestion d'état. */
export default function Collapsible({ title, defaultOpen = false, children }: Props) {
  return (
    <details class="collapsible" open={defaultOpen}>
      <summary>{title}</summary>
      <div class="collapsible-body">{children}</div>
    </details>
  );
}
