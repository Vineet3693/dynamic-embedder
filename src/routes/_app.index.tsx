import { createFileRoute, Link } from '@tanstack/react-router';
import { Activity, Gauge, Waves } from 'lucide-react';
import type { CSSProperties } from 'react';
import { getUnitById, UNITS } from '@/lib/units';

type PlantNode = {
  id: string;
  x: number;
  y: number;
  model: 'vessel' | 'tower' | 'furnace' | 'reactor' | 'exchanger' | 'tank' | 'mixer';
};

const PLANT_NODES: PlantNode[] = [
  { id: 'desalter-v101', x: 7, y: 36, model: 'vessel' },
  { id: 'preheat-train-e100', x: 18, y: 36, model: 'exchanger' },
  { id: 'crude-furnace-h101', x: 29, y: 36, model: 'furnace' },
  { id: 'adu-c101', x: 41, y: 30, model: 'tower' },
  { id: 'vdu-c102', x: 55, y: 28, model: 'tower' },
  { id: 'delayed-coker-v700', x: 69, y: 26, model: 'tower' },
  { id: 'naphtha-hydrotreater-r201', x: 45, y: 51, model: 'reactor' },
  { id: 'catalytic-reformer-r300', x: 57, y: 52, model: 'reactor' },
  { id: 'isomerization-r350', x: 69, y: 53, model: 'reactor' },
  { id: 'fcc-r400', x: 48, y: 69, model: 'tower' },
  { id: 'hydrocracker-r450', x: 61, y: 70, model: 'reactor' },
  { id: 'alkylation-r500', x: 74, y: 70, model: 'reactor' },
  { id: 'diesel-hydrotreater-r600', x: 39, y: 83, model: 'reactor' },
  { id: 'kero-hydrotreater-r650', x: 52, y: 85, model: 'reactor' },
  { id: 'amine-treating-t800', x: 76, y: 39, model: 'tower' },
  { id: 'sour-water-stripper-t900', x: 88, y: 39, model: 'tower' },
  { id: 'sulfur-recovery-r850', x: 89, y: 54, model: 'furnace' },
  { id: 'lpg-recovery-t950', x: 83, y: 69, model: 'tower' },
  { id: 'merox-v980', x: 91, y: 70, model: 'vessel' },
  { id: 'blending-m1000', x: 72, y: 88, model: 'mixer' },
  { id: 'tank-farm-tkfarm', x: 89, y: 88, model: 'tank' },
];

const PIPELINES = [
  ['desalter-v101', 'preheat-train-e100'],
  ['preheat-train-e100', 'crude-furnace-h101'],
  ['crude-furnace-h101', 'adu-c101'],
  ['adu-c101', 'vdu-c102'],
  ['vdu-c102', 'delayed-coker-v700'],
  ['adu-c101', 'naphtha-hydrotreater-r201'],
  ['naphtha-hydrotreater-r201', 'catalytic-reformer-r300'],
  ['catalytic-reformer-r300', 'isomerization-r350'],
  ['vdu-c102', 'fcc-r400'],
  ['fcc-r400', 'hydrocracker-r450'],
  ['hydrocracker-r450', 'alkylation-r500'],
  ['adu-c101', 'diesel-hydrotreater-r600'],
  ['adu-c101', 'kero-hydrotreater-r650'],
  ['delayed-coker-v700', 'amine-treating-t800'],
  ['amine-treating-t800', 'sour-water-stripper-t900'],
  ['sour-water-stripper-t900', 'sulfur-recovery-r850'],
  ['alkylation-r500', 'lpg-recovery-t950'],
  ['lpg-recovery-t950', 'merox-v980'],
  ['diesel-hydrotreater-r600', 'blending-m1000'],
  ['kero-hydrotreater-r650', 'blending-m1000'],
  ['merox-v980', 'blending-m1000'],
  ['blending-m1000', 'tank-farm-tkfarm'],
] as const;

const nodeById = new Map(PLANT_NODES.map((node) => [node.id, node]));

export const Route = createFileRoute('/_app/')({
  head: () => ({
    meta: [
      { title: 'Live Connected Refinery — 3D Process Plane' },
      {
        name: 'description',
        content:
          'Live connected 3D refinery plane showing crude, distillation, conversion, treating, blending, and tank farm units as one integrated process flow.',
      },
      { property: 'og:title', content: 'Live Connected Refinery — 3D Process Plane' },
      {
        property: 'og:description',
        content: 'Explore every refinery unit connected through animated live process pipelines.',
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex min-h-12 items-center gap-3 px-4 pl-12">
          <span className="rounded-sm bg-warning px-2 py-0.5 text-[0.7rem] font-bold uppercase text-background">
            Refinery
          </span>
          <h1 className="text-sm font-semibold md:text-base">Live Connected 3D Process Plane</h1>
          <div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="h-2 w-2 rounded-full bg-live shadow-[0_0_10px_var(--live)] pulse-live" />
            {UNITS.length} units running
          </div>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-3rem)] grid-rows-[1fr_auto] bg-[radial-gradient(circle_at_50%_10%,color-mix(in_oklab,var(--flow)_18%,transparent),transparent_34%),linear-gradient(180deg,var(--background),var(--plant-floor))]">
        <div className="refinery-viewport relative min-h-[560px] overflow-hidden px-4 py-6 md:px-8 md:py-10">
          <div className="absolute left-6 top-6 z-20 grid gap-2 rounded-md border border-border bg-background/70 p-3 text-xs text-muted-foreground backdrop-blur md:left-10 md:top-10">
            <span className="flex items-center gap-2 text-foreground"><Activity className="h-4 w-4 text-live" /> 98.7% uptime</span>
            <span className="flex items-center gap-2"><Gauge className="h-4 w-4 text-warning" /> 142k BPD throughput</span>
            <span className="flex items-center gap-2"><Waves className="h-4 w-4 text-flow" /> live product flow</span>
          </div>

          <div className="refinery-plane absolute left-1/2 top-1/2 h-[720px] w-[1120px] -translate-x-1/2 -translate-y-1/2 rounded-md border border-border/80 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--border)_45%,transparent)_1px,transparent_1px),linear-gradient(0deg,color-mix(in_oklab,var(--border)_45%,transparent)_1px,transparent_1px)] bg-[size:56px_56px] shadow-[0_30px_120px_color-mix(in_oklab,var(--background)_80%,transparent)]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {PIPELINES.map(([from, to]) => {
                const start = nodeById.get(from);
                const end = nodeById.get(to);
                if (!start || !end) return null;
                return (
                  <g key={`${from}-${to}`}>
                    <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="stroke-border" strokeWidth="0.55" />
                    <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="pipeline-flow stroke-flow" strokeWidth="0.34" strokeLinecap="round" />
                  </g>
                );
              })}
            </svg>

            {PLANT_NODES.map((node, index) => {
              const unit = getUnitById(node.id);
              if (!unit) return null;
              return (
                <Link
                  key={node.id}
                  to="/units/$unitId"
                  params={{ unitId: unit.id }}
                  className="unit-node-3d absolute left-0 top-0 z-10 block h-32 w-36 -translate-x-1/2 -translate-y-1/2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ '--x': `${node.x * 11.2}px`, '--y': `${node.y * 7.2}px`, '--delay': `${index * -0.14}s` } as CSSProperties}
                  aria-label={`Open ${unit.name}`}
                >
                  <div className="unit-model-3d group flex h-full flex-col items-center justify-end gap-1 text-center">
                    <UnitModel id={node.id} type={node.model} />
                    <span className="max-w-28 rounded-sm border border-border bg-background/80 px-1.5 py-0.5 text-[0.56rem] font-semibold leading-tight text-foreground shadow-md backdrop-blur group-hover:border-warning">
                      {unit.tag}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 border-t border-border bg-background/80 p-4 backdrop-blur md:grid-cols-4 md:px-8">
          {['Crude Section', 'Distillation Towers', 'Conversion & Reaction', 'Refining & Storage'].map((label, index) => (
            <div key={label} className="rounded-md border border-border bg-card/70 p-3">
              <div className="text-[0.65rem] font-bold uppercase text-warning">0{index + 1}</div>
              <div className="mt-1 text-sm font-semibold text-card-foreground">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function UnitModel({ type }: { type: PlantNode['model'] }) {
  const base = 'relative drop-shadow-[0_16px_18px_color-mix(in_oklab,var(--background)_70%,transparent)]';

  if (type === 'tower') {
    return <span className={`${base} h-16 w-7 rounded-t-full border border-border bg-plant-steel shadow-[inset_-8px_0_16px_color-mix(in_oklab,var(--background)_38%,transparent)] before:absolute before:-left-2 before:top-3 before:h-1 before:w-11 before:bg-warning/70 after:absolute after:-right-2 after:bottom-5 after:h-1 after:w-11 after:bg-flow/70`} />;
  }

  if (type === 'furnace') {
    return <span className={`${base} h-12 w-12 rounded-sm border border-border bg-destructive/80 shadow-[inset_-8px_0_18px_color-mix(in_oklab,var(--background)_35%,transparent)] before:absolute before:left-2 before:top-2 before:h-7 before:w-2 before:bg-warning after:absolute after:right-2 after:top-2 after:h-7 after:w-2 after:bg-warning`} />;
  }

  if (type === 'tank') {
    return <span className={`${base} h-12 w-16 rounded-[50%/18%] border border-border bg-plant-steel before:absolute before:left-0 before:top-2 before:h-10 before:w-full before:rounded-[50%/18%] before:border before:border-border before:bg-card/50 after:absolute after:left-2 after:top-1 after:h-2 after:w-12 after:rounded-full after:bg-flow/40`} />;
  }

  if (type === 'exchanger') {
    return <span className={`${base} h-8 w-16 rounded-full border border-border bg-flow/70 before:absolute before:left-2 before:top-1 before:h-6 before:w-1 before:bg-background/60 after:absolute after:right-2 after:top-1 after:h-6 after:w-1 after:bg-background/60`} />;
  }

  if (type === 'mixer') {
    return <span className={`${base} h-11 w-14 rounded-md border border-border bg-warning/80 before:absolute before:left-1/2 before:top-1 h-11 before:h-9 before:w-1 before:-translate-x-1/2 before:bg-background/50 after:absolute after:left-3 after:top-4 after:h-1 after:w-8 after:bg-background/50`} />;
  }

  return <span className={`${base} h-11 w-11 rounded-full border border-border bg-flow/75 shadow-[inset_-8px_0_16px_color-mix(in_oklab,var(--background)_35%,transparent)] before:absolute before:left-1/2 before:top-[-12px] before:h-4 before:w-3 before:-translate-x-1/2 before:rounded-sm before:bg-plant-steel after:absolute after:left-1/2 after:bottom-[-8px] after:h-3 after:w-8 after:-translate-x-1/2 after:rounded-full after:bg-border`} />;
}