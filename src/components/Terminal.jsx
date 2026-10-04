// Fenêtre de terminal décorative de l'accueil. Le contenu est déjà présent ailleurs dans la page : masquée aux lecteurs d'écran.
// Elle garde toujours sa palette sombre (comme un vrai terminal), quel que soit le thème. Les commandes se tapent une fois (CSS).
export default function Terminal({ lines }) {
  return (
    <div aria-hidden="true" className="terminal-float w-full min-w-0 max-w-xl overflow-hidden rounded-card border border-slate-700 bg-slate-900 shadow-glow lg:justify-self-end">
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-300" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <span className="ml-3 truncate font-mono text-xs text-slate-400">guillaume@grichard.eu: ~</span>
      </div>
      <div className="space-y-3 break-words p-5 font-mono text-sm leading-relaxed">
        {lines.map((l) => (
          <div key={l.cmd} className="term-line">
            <p className="text-slate-100"><span className="text-emerald-400">$</span> <span className="term-cmd">{l.cmd}</span></p>
            <p className="term-out text-slate-300">{l.out}</p>
          </div>
        ))}
        <p className="text-slate-100"><span className="text-emerald-400">$</span> <span className="caret" /></p>
      </div>
    </div>
  );
}
