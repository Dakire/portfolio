/**
 * Date ISO 8601 complète avec fuseau, comme Google le recommande pour datePublished/dateModified.
 * 'YYYY-MM-DD' devient minuit à Paris, avec le bon décalage (heure d'été ou d'hiver) pour ce jour-là.
 */
export const toIso = (d) => {
  if (d.includes('T')) return d;
  const zone = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Paris', timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${d}T12:00:00Z`))
    .find((part) => part.type === 'timeZoneName')?.value;
  return `${d}T00:00:00${zone?.replace('GMT', '') || 'Z'}`;
};
