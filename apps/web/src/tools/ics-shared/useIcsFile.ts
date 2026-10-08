import { parseIcs, type ParsedIcs } from '@grichard/tools-core/ics/parse';
import { useCallback, useState } from 'preact/hooks';

export const MAX_BYTES = 50 * 1024 * 1024;

export type IcsError = 'tooBig' | 'notIcs' | 'read';

interface State {
  file: File | null;
  parsed: ParsedIcs | null;
  error: IcsError | null;
  loading: boolean;
  /** Le texte contient des caractères de remplacement : le fichier n'est probablement pas en UTF-8. */
  encoding: boolean;
}

const EMPTY: State = { file: null, parsed: null, error: null, loading: false, encoding: false };

/**
 * Lecture d'un fichier .ics choisi par l'utilisateur, entièrement dans le navigateur.
 * `error` vaut 'tooBig' | 'notIcs' | 'read' (clé de ui.errors).
 */
export function useIcsFile() {
  const [state, setState] = useState<State>(EMPTY);

  const load = useCallback(async (file: File) => {
    if (file.size > MAX_BYTES) {
      setState({ ...EMPTY, error: 'tooBig' });
      return;
    }
    setState({ ...EMPTY, file, loading: true });
    try {
      const text = await file.text();
      if (!/BEGIN:VCALENDAR/i.test(text) && !/BEGIN:VEVENT/i.test(text)) {
        setState({ ...EMPTY, error: 'notIcs' });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve)); // laisse le navigateur afficher « chargement » avant l'analyse
      setState({
        file,
        parsed: parseIcs(text),
        error: null,
        loading: false,
        encoding: text.includes('�'),
      });
    } catch {
      setState({ ...EMPTY, error: 'read' });
    }
  }, []);

  const clear = useCallback(() => setState(EMPTY), []);
  return { ...state, load, clear };
}
