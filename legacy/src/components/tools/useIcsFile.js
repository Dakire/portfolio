import { useCallback, useState } from 'react';
import { parseIcs } from '../../lib/ics/parse';

export const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Lecture d'un fichier .ics choisi par l'utilisateur, entièrement dans le navigateur.
 * Retourne { file, parsed, error, loading, load, clear } ; `error` vaut 'tooBig' | 'notIcs' | 'read' (clé de ui.errors).
 */
export function useIcsFile() {
  const [state, setState] = useState({ file: null, parsed: null, error: null, loading: false, encoding: false });

  const load = useCallback(async (file) => {
    if (file.size > MAX_BYTES) {
      setState({ file: null, parsed: null, error: 'tooBig', loading: false, encoding: false });
      return;
    }
    setState({ file, parsed: null, error: null, loading: true, encoding: false });
    try {
      const text = await file.text();
      if (!/BEGIN:VCALENDAR/i.test(text) && !/BEGIN:VEVENT/i.test(text)) {
        setState({ file: null, parsed: null, error: 'notIcs', loading: false, encoding: false });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve)); // laisse le navigateur afficher « chargement » avant l'analyse
      setState({ file, parsed: parseIcs(text), error: null, loading: false, encoding: text.includes('�') });
    } catch {
      setState({ file: null, parsed: null, error: 'read', loading: false, encoding: false });
    }
  }, []);

  const clear = useCallback(() => setState({ file: null, parsed: null, error: null, loading: false, encoding: false }), []);
  return { ...state, load, clear };
}
