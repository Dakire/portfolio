// Réponse type du modèle (valide au regard des contrôles) pour tester le générateur d'articles sans appeler l'API.
const paragraph = (fr) =>
  fr
    ? 'Une sauvegarde utile se juge à sa restauration : copiez les données sur un support distinct, vérifiez régulièrement que les fichiers reviennent intacts et documentez la procédure pour que n\'importe quel technicien puisse la rejouer un jour de panne.'
    : 'A useful backup is judged by its restore: copy the data to a separate medium, regularly check that files come back intact and document the procedure so that any technician can replay it on the day something fails.';

const section = (title, fr, n = 1) => `## ${title}\n\n${Array.from({ length: n }, () => paragraph(fr)).join('\n\n')}\n`;

export function makeArticle(lang, overrides = {}) {
  const fr = lang === 'fr';
  const body = [
    fr
      ? 'Une **sauvegarde 3-2-1** protège une petite structure contre la panne, l\'erreur humaine et le rançongiciel. Voyons comment l\'appliquer sans matériel coûteux, et comment vérifier qu\'elle fonctionne.'
      : 'A **3-2-1 backup** protects a small business against failure, human error and ransomware. Let us see how to apply it without expensive hardware, and how to check that it works.',
    '',
    section(fr ? 'Le principe' : 'The principle', fr, 5),
    section(fr ? 'Choisir les supports' : 'Choosing the media', fr, 5),
    '```text\n3 copies, 2 media, 1 off-site\n```\n',
    section(fr ? 'Tester la restauration' : 'Testing the restore', fr, 5),
    section(fr ? 'Les pièges courants' : 'Common pitfalls', fr, 4),
    fr
      ? `Pour vérifier la messagerie en parallèle, voir [SPF, DKIM, DMARC expliqués](/blog/spf-dkim-dmarc-expliques/) et [l'outil DNS](/outils/dns/).\n`
      : `To check email at the same time, see [SPF, DKIM and DMARC explained](/en/blog/spf-dkim-dmarc-explained/) and [the DNS tool](/en/tools/dns/).\n`,
    '## Sources\n',
    '- [CISA : Data Backup Options](https://www.cisa.gov/resources-tools/resources/data-backup-options) (principes de sauvegarde)',
    '- [ANSSI : Sauvegarde des systèmes d\'information](https://cyber.gouv.fr/) (recommandations)',
    '- [Microsoft Learn : Azure Backup](https://learn.microsoft.com/azure/backup/) (documentation)',
  ].join('\n');

  return {
    slug: fr ? 'sauvegarde-3-2-1-regle-pour-pme-sans-materiel-couteux' : 'backup-3-2-1-rule-for-small-business-without-costly-hardware',
    title: fr ? 'Sauvegarde 3-2-1 : la règle simple pour protéger une PME' : 'The 3-2-1 backup rule: a simple way to protect a small business',
    description: fr
      ? 'Trois copies, deux supports, une hors site : comment appliquer la règle 3-2-1 dans une petite structure et vérifier que la restauration fonctionne.'
      : 'Three copies, two media, one off-site: how to apply the 3-2-1 rule in a small business and check that restoring actually works.',
    body,
    ...overrides,
  };
}

export const makeResponse = (overrides = {}) => ({
  fr: makeArticle('fr', overrides.fr),
  en: makeArticle('en', overrides.en),
  claims_to_verify: ['La règle 3-2-1 est décrite par la CISA', 'L\'adresse de la documentation Azure Backup est correcte', 'Les rançongiciels ciblent aussi les sauvegardes accessibles'],
});
