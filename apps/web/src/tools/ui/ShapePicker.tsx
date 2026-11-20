interface Option {
  id: string;
  /** Nom accessible de la forme (lu par les lecteurs d'écran, affiché en info-bulle). */
  label: string;
  /** Vignette : un SVG complet (texte produit par le code de rendu, jamais saisi par l'utilisateur). */
  svg: string;
}

interface Props {
  name: string;
  legend: string;
  value: string;
  options: Option[];
  onChange: (id: string) => void;
}

/**
 * Choix d'une forme parmi des vignettes : un groupe de boutons radio natifs (flèches du clavier, un seul arrêt de tabulation),
 * la vignette est une image `data:` décorative, le nom de la forme est porté par le bouton radio.
 */
export default function ShapePicker({ name, legend, value, options, onChange }: Props) {
  return (
    <fieldset class="shape-picker">
      <legend>{legend}</legend>
      <div class="shape-grid">
        {options.map((option) => (
          <label key={option.id} class="shape-option" title={option.label}>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              aria-label={option.label}
              onChange={() => onChange(option.id)}
            />
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(option.svg)}`}
              alt=""
              width="40"
              height="40"
              aria-hidden="true"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
