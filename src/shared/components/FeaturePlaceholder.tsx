type FeaturePlaceholderProps = {
  title: string
  description: string
}

const layers = ['domain', 'application', 'infrastructure', 'presentation']

export function FeaturePlaceholder({
  title,
  description,
}: FeaturePlaceholderProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          Feature Module
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {layers.map((layer) => (
          <div
            key={layer}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              {layer}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Reserved for this feature&apos;s {layer} layer.
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
