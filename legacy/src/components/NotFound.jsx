// Page 404 (servie par Apache via ErrorDocument). Rendue au build ; public/js/404.js fait fuir le bouton.
// Sans JavaScript, au clavier ou avec un lecteur d'écran, le bouton reste un simple lien qui fonctionne.
import Shell from './Shell';
import Button from './ui/Button';

export default function NotFound() {
  return (
    <Shell>
      <p className="mb-2 font-mono text-sm text-link" aria-hidden="true">HTTP/1.1 404 Not Found</p>
      <h1 className="mb-4 text-title font-extrabold tracking-tight text-ink">404 : il n&apos;y a rien ici</h1>
      <p className="mb-2 text-lg text-body">
        Vous cherchiez une page ? Moi aussi. On ne l&apos;a pas retrouvée.
      </p>
      <p className="mb-8 text-lg text-body">
        Vous pouvez retourner à l&apos;accueil… si vous arrivez à attraper le bouton.
      </p>

      <div id="dodge-zone" className="relative h-56 overflow-hidden rounded-card border border-dashed border-line-strong bg-surface/50">
        <Button id="dodge-btn" href="/" size="lg" className="absolute left-4 top-4 motion-safe:transition-all motion-safe:duration-200">
          Retourner à l&apos;accueil
        </Button>
      </div>

      <p id="taunt" role="status" className="mt-4 min-h-6 font-medium text-ink"></p>
      <p id="score" className="font-mono text-sm text-body" hidden>Esquives : <span id="score-n">0</span></p>

      <p className="mt-10 text-body">
        Sinon, <a href="/blog/" className="link">le blog</a> ne se sauve pas, lui.
      </p>
      <p className="mt-6 text-sm text-body" lang="en">
        English: nothing here. Try to catch the button to go back home.
      </p>
    </Shell>
  );
}
