export default function SectionHeading({ id, icon: Icon, children }) {
  return (
    <div className="mb-8 flex items-center gap-4 md:mb-10">
      <h2 id={id} className="flex items-center gap-3 text-title font-bold tracking-tight text-ink">
        <span className="icon-tile h-11 w-11 shrink-0" aria-hidden="true">
          <Icon className="h-6 w-6" />
        </span>
        {children}
      </h2>
      <div className="h-px flex-1 bg-linear-to-r from-brand/60 via-line-strong/50 to-transparent" aria-hidden="true" />
    </div>
  );
}
