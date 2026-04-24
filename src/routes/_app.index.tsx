import { createFileRoute, Link } from '@tanstack/react-router';
import { UNITS } from '@/lib/units';

export const Route = createFileRoute('/_app/')({
  head: () => ({
    meta: [
      { title: 'Refinery Process Units — 3D Viewer Library' },
      {
        name: 'description',
        content:
          'Interactive 3D isolation viewers for refinery units: FCC, Hydrocracker, Isomerization, Hydrotreaters, SRU, Merox, Preheat Train and more.',
      },
      { property: 'og:title', content: 'Refinery Process Units — 3D Viewer Library' },
      {
        property: 'og:description',
        content: 'Browse 10 industrial process units with live telemetry and 3D isolation views.',
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen w-full bg-[#0a0e17] text-[#c8d6e5]">
      <header className="sticky top-0 z-40 border-b border-[#1e2a3a] bg-[#0a0e17]/90 backdrop-blur">
        <div className="flex h-12 items-center px-4 pl-12">
          <span className="mr-3 rounded-sm bg-[#f0c040] px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-[#0a0e17]">
            Refinery
          </span>
          <h2 className="text-[0.95rem] font-semibold text-[#e0e8f0]">
            Process Units<span className="ml-2 text-[#f0c040]">3D Library</span>
          </h2>
          <div className="ml-auto flex items-center gap-2 text-[0.75rem]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
            <span>{UNITS.length} units online</span>
          </div>
        </div>
      </header>

      <section className="px-6 pt-10 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-[#e0e8f0] md:text-4xl">
          Refinery Process Unit Library
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[#8a9ab0]">
          Select a unit from the sidebar — or pick a card below — to open its standalone 3D
          isolation viewer with live process readings, yields, and interactive controls.
        </p>
      </section>

      <section className="px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {UNITS.map((u) => (
            <Link
              key={u.id}
              to="/units/$unitId"
              params={{ unitId: u.id }}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c040]"
            >
              <article
                className="group relative h-full overflow-hidden rounded-md border border-[#1a2540] bg-[#0c121e]/90 p-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:shadow-[0_8px_32px_-8px_var(--accent)]"
                style={{ ['--accent' as string]: u.accent }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="rounded-sm px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-[#0a0e17]"
                    style={{ backgroundColor: u.accent }}
                  >
                    {u.tag}
                  </span>
                  <span className="text-[0.6rem] uppercase tracking-wider text-[#5a6a80]">
                    {u.category}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border"
                    style={{ borderColor: `${u.accent}55`, backgroundColor: `${u.accent}15` }}
                  >
                    <u.icon className="h-4 w-4" {...({ color: u.accent } as Record<string, unknown>)} />
                  </span>
                  <h3 className="text-base font-semibold leading-tight text-[#e0e8f0]">
                    {u.name}
                  </h3>
                </div>
                <p className="mt-2 text-xs text-[#8a9ab0]">{u.subtitle}</p>

                <div className="mt-4 flex items-center justify-between border-t border-[#1a2540] pt-3">
                  <span className="flex items-center gap-1.5 text-[0.65rem]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
                    <span className="text-[#22c55e]">ONLINE</span>
                  </span>
                  <span
                    className="text-[0.7rem] font-medium tracking-wider transition-transform group-hover:translate-x-0.5"
                    style={{ color: u.accent }}
                  >
                    OPEN →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#1e2a3a] py-6 text-center text-xs text-[#5a6a80]">
        Three.js · Dark Industrial Theme · Production-Ready Viewer
      </footer>
    </div>
  );
}
