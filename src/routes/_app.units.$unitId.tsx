import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { getUnitById } from '@/lib/units';

export const Route = createFileRoute('/_app/units/$unitId')({
  loader: ({ params }) => {
    const unit = getUnitById(params.unitId);
    if (!unit) throw notFound();
    return { unit };
  },
  head: ({ loaderData }) => {
    const u = loaderData?.unit;
    if (!u) return { meta: [{ title: 'Unit not found' }] };
    return {
      meta: [
        { title: `${u.tag} | ${u.name} — 3D Viewer` },
        { name: 'description', content: `${u.name} — ${u.subtitle}. Interactive 3D isolation viewer with live process telemetry.` },
        { property: 'og:title', content: `${u.tag} | ${u.name}` },
        { property: 'og:description', content: u.subtitle },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0e17] text-[#c8d6e5]">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[#f0c040]">Unit not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-[#38bdf8] hover:underline">
          ← Back to all units
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0e17] text-[#c8d6e5]">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-[#ef4444]">Failed to load unit</h1>
        <p className="mt-2 text-sm text-[#8a9ab0]">{error.message}</p>
      </div>
    </div>
  ),
  component: UnitViewerPage,
});

function UnitViewerPage() {
  const { unit } = Route.useLoaderData();
  // Each unit's HTML lives in /public/units/<id>.html and runs unmodified inside the iframe.
  // This guarantees 100% identical behavior, styling, and Three.js scene as the standalone viewer.
  return (
    <div className="absolute inset-0 bg-[#0a0e17]">
      <iframe
        key={unit.id}
        src={`/units/${unit.id}.html`}
        title={`${unit.tag} ${unit.name}`}
        className="h-full w-full border-0"
        // Permissive sandbox so the original Three.js + audio + modal interactions all work.
        // (Same-origin keeps it identical to the standalone HTML.)
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
