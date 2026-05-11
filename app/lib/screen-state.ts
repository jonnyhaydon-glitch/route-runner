import type { GeocodeResult, WalkingRoute } from './mapbox';

export type Tab = 'discover' | 'design' | 'saved' | 'profile';
export type Mode = null | 'routes' | 'live' | 'summary';

export interface DesignParams {
  distance: number;
  pace: PaceId;
  prefs: Record<string, boolean>;
  mood: MoodId | null;
  destination: GeocodeResult | null;
}

export type PaceId = 'easy' | 'steady' | 'tempo' | 'custom';
export type MoodId = 'reset' | 'push' | 'explore' | 'blast';

export interface GeneratedRoute {
  id: string;
  name: string;
  seed: number;
  distanceMeters: number;
  durationSeconds: number;
  rationale: string;
  geometry: GeoJSON.LineString | null;
  origin: [number, number] | null;
  destination: [number, number] | null;
  destinationLabel: string;
  elevationMeters: number;
  offroadPct: number;
  source: WalkingRoute | null;
  isRecommended: boolean;
}

export const PACE_OPTIONS: Array<{ id: PaceId; label: string; val: string; secondsPerKm: number }> = [
  { id: 'easy', label: 'Easy', val: '6:00', secondsPerKm: 360 },
  { id: 'steady', label: 'Steady', val: '5:15', secondsPerKm: 315 },
  { id: 'tempo', label: 'Tempo', val: '4:45', secondsPerKm: 285 },
  { id: 'custom', label: 'Custom', val: '—', secondsPerKm: 330 },
];

export const PREF_LIST: string[] = ['Parks', 'Rivers', 'Quiet streets', 'Scenic', 'Hills', 'Flat', 'Avoid traffic'];

export const MOOD_OPTIONS: Array<{ id: MoodId; label: string }> = [
  { id: 'reset', label: 'Need a reset' },
  { id: 'push', label: 'Push myself' },
  { id: 'explore', label: 'Explore somewhere new' },
  { id: 'blast', label: 'Quick blast' },
];

export function defaultDesignParams(): DesignParams {
  return {
    distance: 7,
    pace: 'steady',
    prefs: {
      Parks: true,
      Rivers: true,
      'Quiet streets': false,
      Scenic: true,
      Hills: false,
      Flat: false,
      'Avoid traffic': true,
    },
    mood: 'explore',
    destination: null,
  };
}

export function paceSecondsPerKm(id: PaceId): number {
  return PACE_OPTIONS.find((p) => p.id === id)?.secondsPerKm ?? 330;
}

export function prefsToPromptString(prefs: Record<string, boolean>): string {
  const on = Object.keys(prefs).filter((k) => prefs[k]);
  if (on.length === 0) return '';
  const mapping: Record<string, string> = {
    Parks: 'Prefer routes through parks and green space.',
    Rivers: 'Prefer routes along rivers or canals.',
    'Quiet streets': 'Prefer quiet residential streets over commercial ones.',
    Scenic: 'Favour scenic routes with views.',
    Hills: 'Prefer routes with some hills and elevation.',
    Flat: 'Prefer flat routes with minimal elevation change.',
    'Avoid traffic': 'Avoid busy main roads with heavy traffic.',
  };
  return on.map((p) => mapping[p] ?? p).join(' ');
}
