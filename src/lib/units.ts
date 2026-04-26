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
    id: 'adu-c101',
    tag: 'C-101',
    name: 'Atmospheric Distillation Unit',
    subtitle: 'Primary crude separation column',
    category: 'Separation',
    accent: '#f0c040',
    icon: Factory,
  },
  {
    id: 'desalter-v101',
    tag: 'V-101',
    name: 'Electrostatic Desalter',
    subtitle: 'Crude salt and water removal',
    category: 'Separation',
    accent: '#f0c040',
    icon: Droplet,
  },
  {
    id: 'crude-furnace-h101',
    tag: 'H-101',
    name: 'Crude Furnace',
    subtitle: 'Box-type cabin fired heater',
    category: 'Utilities',
    accent: '#ef4444',
    icon: Flame,
  },
  {
    id: 'vdu-c102',
    tag: 'C-102',
    name: 'Vacuum Distillation Unit',
    subtitle: 'Heavy separation under deep vacuum',
    category: 'Separation',
    accent: '#ef4444',
    icon: Factory,
  },
  {
    id: 'catalytic-reformer-r300',
    tag: 'R-300',
    name: 'CCR Catalytic Reformer',
    subtitle: 'Continuous catalyst regeneration reforming',
    category: 'Upgrading',
    accent: '#f0c040',
    icon: FlaskConical,
  },
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
    id: 'alkylation-r500',
    tag: 'R-500',
    name: 'Sulfuric Acid Alkylation Unit',
    subtitle: 'High-octane alkylate production',
    category: 'Upgrading',
    accent: '#f0c040',
    icon: Beaker,
  },
  {
    id: 'diesel-hydrotreater-r600',
    tag: 'R-600',
    name: 'Diesel Hydrotreater',
    subtitle: 'Ultra-low sulfur diesel production',
    category: 'Treating',
    accent: '#f0c040',
    icon: Droplet,
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
    id: 'delayed-coker-v700',
    tag: 'V-700',
    name: 'Delayed Coker',
    subtitle: 'Thermal cracking coke drum system',
    category: 'Conversion',
    accent: '#f0c040',
    icon: Flame,
  },
  {
    id: 'amine-treating-t800',
    tag: 'T-800',
    name: 'Amine Gas Treating',
    subtitle: 'Sour gas removal unit',
    category: 'Treating',
    accent: '#22c55e',
    icon: Wind,
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
    id: 'blending-m1000',
    tag: 'M-1000',
    name: 'Blending Unit',
    subtitle: 'Final product mixing',
    category: 'Utilities',
    accent: '#f0c040',
    icon: GitBranch,
  },
  {
    id: 'tank-farm-tkfarm',
    tag: 'TK-FARM',
    name: 'Product Storage / Tank Farm',
    subtitle: 'Floating roof storage systems',
    category: 'Storage',
    accent: '#f0c040',
    icon: Factory,
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
