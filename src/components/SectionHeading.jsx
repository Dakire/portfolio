export default function SectionHeading({ id, icon: Icon, children }) {
  return (
    <div className="flex items-center gap-4 mb-8 md:mb-10">
      <h2 id={id} className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
        <Icon className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 text-emerald-400" aria-hidden="true" />
        {children}
      </h2>
      <div className="h-px bg-slate-700 flex-1" aria-hidden="true" />
    </div>
  );
}
