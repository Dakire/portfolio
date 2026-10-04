// Identifiants des zones hydratées côté client et données qu'elles reçoivent (voir src/islands.jsx).
export const HEADER_ROOT_ID = 'header-root';
export const CONTACT_ROOT_ID = 'contact-root';
export const ISLANDS_DATA_ID = 'islands-data';

// Données minimales dont les îlots ont besoin, sérialisées dans le HTML par le pré-rendu.
export const islandsData = (lang, t) => ({ lang, ui: t.ui, nav: t.nav, form: t.form });
