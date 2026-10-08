import { useState } from 'react';
import { CircleCheck, Copy } from 'lucide-react';
import Button from './Button';

/** Bouton icône « copier » : la coche remplace l'icône un instant ; l'étiquette accessible annonce « copié ». */
export default function CopyButton({ text, label, copiedLabel, className }) {
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
    <Button variant="ghost" icon onClick={copy} aria-label={copied ? copiedLabel : label} className={className}>
      {copied ? <CircleCheck className="h-4 w-4 text-link" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
    </Button>
  );
}
