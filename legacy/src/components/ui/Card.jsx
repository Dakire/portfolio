import { cx } from '../../lib/cx';

/**
 * Carte. `glow` ajoute le halo qui suit le pointeur (public/js/fx.js) et le soulèvement au survol ;
 * `solid` utilise un fond opaque (formulaire, cartes lues de près).
 */
export default function Card({ as: Tag = 'div', glow = false, solid = false, className, ...props }) {
  return <Tag className={cx('card', solid && 'card-solid', glow && 'card-glow', className)} {...props} />;
}
