// Catalog of all 10 chemical process units. Used by the landing grid.
// Routes for non-FCC units will be added as they are converted.
export type UnitInfo = {
  id: string;
  tag: string;
  name: string;
  subtitle: string;
  category: string;
  accent: string; // hex
  route?: string; // present when a TSX route exists
};

export const UNITS: UnitInfo[] = [
  {
    id: 'fcc-r400',
    tag: 'R-400',
    name: 'Fluid Catalytic Cracker',
    subtitle: 'Heavy-to-light catalytic cracking unit',
    category: 'Conversion',
    accent: '#f0c040',
    route: '/units/fcc-r400',
  },
  {
    id: 'hydrocracker-r450',
    tag: 'R-450',
    name: 'Hydrocracker',
    subtitle: 'Heavy molecule hydrocracking',
    category: 'Conversion',
    accent: '#f0c040',
  },
  {
    id: 'isomerization-r350',
    tag: 'R-350',
    name: 'Isomerization Unit',
    subtitle: 'Light naphtha octane booster',
    category: 'Upgrading',
    accent: '#f0c040',
  },
  {
    id: 'kero-hydrotreater-r650',
    tag: 'R-650',
    name: 'Kero Hydrotreater',
    subtitle: 'Jet fuel production',
    category: 'Treating',
    accent: '#f0c040',
  },
  {
    id: 'lpg-recovery-t950',
    tag: 'T-950',
    name: 'LPG Recovery Unit',
    subtitle: 'Light end separation',
    category: 'Separation',
    accent: '#f0c040',
  },
  {
    id: 'merox-v980',
    tag: 'V-980',
    name: 'Merox',
    subtitle: 'Mercaptan extraction / sweetening',
    category: 'Treating',
    accent: '#38bdf8',
  },
  {
    id: 'naphtha-hydrotreater-r201',
    tag: 'R-201',
    name: 'Naphtha Hydrotreater',
    subtitle: 'Sulfur / nitrogen removal',
    category: 'Treating',
    accent: '#f0c040',
  },
  {
    id: 'preheat-train-e100',
    tag: 'E-100',
    name: 'Preheat Train',
    subtitle: 'Primary heat exchange network',
    category: 'Utilities',
    accent: '#f0c040',
  },
  {
    id: 'sour-water-stripper-t900',
    tag: 'T-900',
    name: 'Sour Water Stripper',
    subtitle: 'Effluent treatment',
    category: 'Utilities',
    accent: '#f0c040',
  },
  {
    id: 'sulfur-recovery-r850',
    tag: 'R-850',
    name: 'Sulfur Recovery (Claus)',
    subtitle: 'SRU — Claus process',
    category: 'Environmental',
    accent: '#f0c040',
  },
];
