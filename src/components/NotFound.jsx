// Page 404 (servie par Apache via ErrorDocument). Rendue au build ; public/js/404.js ne fait que varier l'excuse.
import Shell from './Shell';

const EXCUSES = [
  'Ça marche sur mon poste.',
  "Avez-vous essayé de l'éteindre puis de le rallumer ?",
  "C'est sûrement le DNS. (C'est toujours le DNS.)",
  'Ticket escaladé au N4. Délai de réponse : 3 à 5 jours ouvrés, ou jamais.',
  "Le stagiaire a supprimé la page. Il y en avait pourtant une sauvegarde, non ?",
];

const btn = 'inline-block px-6 py-3 rounded-lg font-medium transition-colors';

export default function NotFound() {
  return (
    <Shell>
      <p className="font-mono text-emerald-300 text-sm mb-2" aria-hidden="true">HTTP/1.1 404 Not Found</p>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
        404 : cette page est partie en spam
      </h1>
      <p className="text-lg text-slate-300 mb-8">
        Elle a échoué à tous les contrôles d&apos;authentification et a été mise en quarantaine. Désolé pour la gêne.
      </p>

      <figure className="mb-8">
        <figcaption className="sr-only">Rapport de diagnostic de la page demandée</figcaption>
        <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto text-sm leading-relaxed text-slate-200">
          <code>{`$ dig +short cette-page.grichard.eu
;; ->>HEADER<<- status: NXDOMAIN

Authentication-Results: grichard.eu;
       spf=fail    (cette page n'est pas autorisée à exister)
       dkim=none   (aucune signature, aucun contenu)
       dmarc=fail  (p=reject)

550 5.1.1 La page demandée n'existe pas.`}</code>
        </pre>
      </figure>

      <p className="text-white font-semibold mb-1">Réponse du support :</p>
      <blockquote id="excuse" className="border-l-4 border-emerald-500 pl-4 text-slate-200 mb-10 italic">
        {EXCUSES[0]}
      </blockquote>

      <ul className="flex flex-wrap gap-4">
        <li><a href="/" className={`${btn} bg-emerald-700 hover:bg-emerald-600 text-white`}>Retour à la maison</a></li>
        <li><a href="/blog/" className={`${btn} bg-slate-800 hover:bg-slate-700 text-white border border-slate-600`}>Lire le blog</a></li>
      </ul>
      <p className="text-sm text-slate-300 mt-8" lang="en">
        English: the page you asked for does not exist. It failed SPF, DKIM and DMARC, and was rejected.
      </p>
      <script type="application/json" id="excuses" dangerouslySetInnerHTML={{ __html: JSON.stringify(EXCUSES) }} />
    </Shell>
  );
}
