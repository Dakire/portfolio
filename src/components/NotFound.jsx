// Page 404 (servie par Apache via ErrorDocument). Rendue au build ; public/js/404.js fait fuir le bouton.
// Sans JavaScript, au clavier ou avec un lecteur d'écran, le bouton reste un simple lien qui fonctionne.
import Shell from './Shell';

export default function NotFound() {
  return (
    <Shell>
      <p className="font-mono text-emerald-300 text-sm mb-2" aria-hidden="true">HTTP/1.1 404 Not Found</p>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">404 : il n&apos;y a rien ici</h1>
      <p className="text-lg text-slate-300 mb-2">
        Vous cherchiez une page ? Moi aussi. On ne l&apos;a pas retrouvée.
      </p>
      <p className="text-lg text-slate-300 mb-8">
        Vous pouvez retourner à l&apos;accueil… si vous arrivez à attraper le bouton.
      </p>

      <div id="dodge-zone" className="relative h-56 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 overflow-hidden">
        <a
          id="dodge-btn"
          href="/"
          className="absolute left-4 top-4 inline-block bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-emerald-900/30 motion-safe:transition-all motion-safe:duration-200"
        >
          Retourner à l&apos;accueil
        </a>
      </div>

      <p id="taunt" role="status" className="mt-4 min-h-6 text-slate-200 font-medium"></p>
      <p id="score" className="text-sm text-slate-300 font-mono" hidden>Esquives : <span id="score-n">0</span></p>

      <p className="mt-10 text-slate-300">
        Sinon, <a href="/blog/" className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2">le blog</a> ne se sauve pas, lui.
      </p>
      <p className="text-sm text-slate-300 mt-6" lang="en">
        English: nothing here. Try to catch the button to go back home.
      </p>
    </Shell>
  );
}
