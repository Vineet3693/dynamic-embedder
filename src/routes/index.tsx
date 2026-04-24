import { createFileRoute, Link } from '@tanstack/react-router';
import { UNITS } from '@/lib/units';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Refinery Process Units — 3D Viewer' },
      {
        name: 'description',
        content:
          'Interactive 3D isolation viewers for refinery process units: FCC, Hydrocracker, Isomerization, Hydrotreaters, SRU, Merox and more.',
      },
      { property: 'og:title', content: 'Refinery Process Units — 3D Viewer' },
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
    <div className="min-h-screen bg-[#0a0e17] text-[#c8d6e5]">
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b border-[#1e2a3a] bg-[#0a0e17]/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-7xl items-center px-4">
          <span className="mr-3 rounded-sm bg-[#f0c040] px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-[#0a0e17]">
            Refinery
          </span>
          <h2 className="text-[0.95rem] font-semibold text-[#e0e8f0]">
            Process Units<span className="ml-2 text-[#f0c040]">3D</span>
          </h2>
          <div className="ml-auto flex items-center gap-2 text-[0.75rem]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
            <span>{UNITS.length} units online</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#e0e8f0] md:text-4xl">
          Refinery Process Unit Library
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[#8a9ab0]">
          Select a unit to open its standalone 3D isolation viewer with live process readings,
          yields, and interactive controls.
        </p>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {UNITS.map((u) => {
            const card = (
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
                <h3 className="mt-3 text-base font-semibold text-[#e0e8f0]">{u.name}</h3>
                <p className="mt-1 text-xs text-[#8a9ab0]">{u.subtitle}</p>

                <div className="mt-4 flex items-center justify-between border-t border-[#1a2540] pt-3">
                  <span className="flex items-center gap-1.5 text-[0.65rem]">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: u.route ? '#22c55e' : '#5a6a80',
                        boxShadow: u.route ? '0 0 6px #22c55e' : 'none',
                      }}
                    />
                    <span style={{ color: u.route ? '#22c55e' : '#5a6a80' }}>
                      {u.route ? 'ONLINE' : 'PENDING'}
                    </span>
                  </span>
                  <span
                    className="text-[0.7rem] font-medium tracking-wider transition-transform group-hover:translate-x-0.5"
                    style={{ color: u.route ? u.accent : '#5a6a80' }}
                  >
                    {u.route ? 'OPEN →' : 'SOON'}
                  </span>
                </div>
              </article>
            );

            return u.route ? (
              <Link key={u.id} to={u.route} className="block focus:outline-none">
                {card}
              </Link>
            ) : (
              <div key={u.id} className="cursor-not-allowed opacity-70">
                {card}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-[#1e2a3a] py-6 text-center text-xs text-[#5a6a80]">
        Three.js · Dark Industrial Theme · Production-Ready Viewer
      </footer>
    </div>
  );
}
