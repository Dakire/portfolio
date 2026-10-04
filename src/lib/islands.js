// Identifiants des zones hydratées côté client et données qu'elles reçoivent.
// Le reste du site est du HTML statique : menu, thème, palette et cookies sont gérés par de petits scripts de public/js/.
export const CONTACT_ROOT_ID = 'contact-root';
export const DNS_ROOT_ID = 'dns-root';
export const ISLANDS_DATA_ID = 'islands-data';

// Données minimales dont les îlots ont besoin, sérialisées dans le HTML par le pré-rendu.
export const islandsData = (lang, t) => ({ lang, form: t.form });
