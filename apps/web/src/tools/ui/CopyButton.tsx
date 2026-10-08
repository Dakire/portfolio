import { CircleCheck, Copy } from 'lucide-preact';
import { useState } from 'preact/hooks';
import Button from './Button';

interface Props {
  text: string;
  label: string;
  copiedLabel: string;
  class?: string;
}

/** Bouton icône « copier » : la coche remplace l'icône un instant ; l'étiquette accessible annonce « copié ». */
export default function CopyButton({ text, label, copiedLabel, class: className }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // presse-papiers indisponible (page non sécurisée, autorisation refusée) : le texte reste sélectionnable
    }
  };
  return (
    <Button
      variant="ghost"
      icon
      onClick={copy}
      aria-label={copied ? copiedLabel : label}
      class={className}
    >
      {copied ? (
        <CircleCheck size={18} aria-hidden="true" />
      ) : (
        <Copy size={18} aria-hidden="true" />
      )}
    </Button>
  );
}
