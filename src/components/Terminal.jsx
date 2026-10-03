// Fenêtre de terminal décorative de l'accueil. Le contenu est déjà présent ailleurs dans la page : masquée aux lecteurs d'écran.
export default function Terminal({ lines }) {
  return (
    <div aria-hidden="true" className="terminal-float min-w-0 w-full max-w-xl overflow-hidden lg:justify-self-end rounded-2xl border border-slate-700/80 bg-slate-900/80 shadow-2xl shadow-emerald-950/40 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-300/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <span className="ml-3 font-mono text-xs text-slate-400">guillaume@grichard.eu: ~</span>
      </div>
      <div className="space-y-3 p-5 font-mono text-sm leading-relaxed break-words">
        {lines.map((l) => (
          <div key={l.cmd}>
            <p className="text-slate-100"><span className="text-emerald-400">$</span> {l.cmd}</p>
            <p className="text-slate-300">{l.out}</p>
          </div>
        ))}
        <p className="text-slate-100"><span className="text-emerald-400">$</span> <span className="caret" /></p>
      </div>
    </div>
  );
}
