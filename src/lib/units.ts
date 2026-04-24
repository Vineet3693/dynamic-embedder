import { Factory, FlaskConical, Beaker, Droplet, Wind, Flame, GitBranch, Thermometer, Waves, Zap } from 'lucide-react';
import type { ComponentType } from 'react';

export type UnitInfo = {
  id: string;          // also used as the URL segment and the public/units file name (without .html)
  tag: string;
  name: string;
  subtitle: string;
  category: string;
  accent: string;      // hex, matches the unit's own theme accent
  icon: ComponentType<{ className?: string }>;
};

export const UNITS: UnitInfo[] = [
  {
    id: 'fcc-r400',
    tag: 'R-400',
    name: 'Fluid Catalytic Cracker',
    subtitle: 'Heavy-to-light catalytic cracking',
    category: 'Conversion',
    accent: '#f0c040',
    icon: Factory,
  },
  {
    id: 'hydrocracker-r450',
    tag: 'R-450',
    name: 'Hydrocracker',
    subtitle: 'Heavy molecule hydrocracking',
    category: 'Conversion',
    accent: '#f0c040',
    icon: GitBranch,
  },
  {
    id: 'isomerization-r350',
    tag: 'R-350',
    name: 'Isomerization Unit',
    subtitle: 'Light naphtha octane booster',
    category: 'Upgrading',
    accent: '#f0c040',
    icon: FlaskConical,
  },
  {
    id: 'kero-hydrotreater-r650',
    tag: 'R-650',
    name: 'Kero Hydrotreater',
    subtitle: 'Jet fuel production',
    category: 'Treating',
    accent: '#f0c040',
    icon: Droplet,
  },
  {
    id: 'lpg-recovery-t950',
    tag: 'T-950',
    name: 'LPG Recovery Unit',
    subtitle: 'Light end separation',
    category: 'Separation',
    accent: '#f0c040',
    icon: Wind,
  },
  {
    id: 'merox-v980',
    tag: 'V-980',
    name: 'Merox',
    subtitle: 'Mercaptan extraction / sweetening',
    category: 'Treating',
    accent: '#38bdf8',
    icon: Beaker,
  },
  {
    id: 'naphtha-hydrotreater-r201',
    tag: 'R-201',
    name: 'Naphtha Hydrotreater',
    subtitle: 'Sulfur / nitrogen removal',
    category: 'Treating',
    accent: '#f0c040',
    icon: Droplet,
  },
  {
    id: 'preheat-train-e100',
    tag: 'E-100',
    name: 'Preheat Train',
    subtitle: 'Primary heat exchange network',
    category: 'Utilities',
    accent: '#f0c040',
    icon: Thermometer,
  },
  {
    id: 'sour-water-stripper-t900',
    tag: 'T-900',
    name: 'Sour Water Stripper',
    subtitle: 'Effluent treatment',
    category: 'Utilities',
    accent: '#f0c040',
    icon: Waves,
  },
  {
    id: 'sulfur-recovery-r850',
    tag: 'R-850',
    name: 'Sulfur Recovery (Claus)',
    subtitle: 'SRU — Claus process',
    category: 'Environmental',
    accent: '#f0c040',
    icon: Flame,
  },
];

export const UNIT_IDS = UNITS.map((u) => u.id);
export type UnitId = (typeof UNITS)[number]['id'];

export function getUnitById(id: string): UnitInfo | undefined {
  return UNITS.find((u) => u.id === id);
}

// Re-export to satisfy unused-import lints in some setups.
export const PlantIcon = Zap;
