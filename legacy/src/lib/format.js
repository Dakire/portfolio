// Date longue dans la langue demandée. Fuseau UTC : le résultat est identique au build et dans le navigateur.
export const formatDate = (iso, locale) =>
  new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
