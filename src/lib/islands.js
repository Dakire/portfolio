// Identifiants de la zone hydratée côté client (le formulaire de contact) et données qu'elle reçoit.
// Le reste du site est du HTML statique : menu, thème et cookies sont gérés par de petits scripts de public/js/.
export const CONTACT_ROOT_ID = 'contact-root';
export const ISLANDS_DATA_ID = 'islands-data';

// Données minimales dont le formulaire a besoin, sérialisées dans le HTML par le pré-rendu.
export const islandsData = (lang, t) => ({ lang, form: t.form });
