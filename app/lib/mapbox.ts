export type Coords = [number, number];

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function parsePaceToSecondsPerKm(input: string): number | null {
  const m = input.trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function getCurrentPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location not supported on this device'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied — enable it in your browser to plan a route'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'Could not determine your location'
              : err.code === err.TIMEOUT
                ? 'Location request timed out'
                : 'Location error';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

export interface GeocodeResult {
  coords: Coords;
  label: string;
}

export interface PlaceSuggestion {
  mapboxId: string;
  name: string;
  description: string;
}

export async function suggestPlaces(
  query: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  if (!TOKEN) throw new Error('Mapbox token missing');
  const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest');
  url.searchParams.set('q', query);
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('session_token', sessionToken);
  url.searchParams.set('language', 'en');
  url.searchParams.set('limit', '6');
  url.searchParams.set('proximity', 'ip');
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`Suggest failed (${r.status})`);
  const data = await r.json();
  const items = (data.suggestions ?? []) as Array<{
    mapbox_id: string;
    name?: string;
    name_preferred?: string;
    place_formatted?: string;
    full_address?: string;
  }>;
  return items.map((i) => ({
    mapboxId: i.mapbox_id,
    name: i.name_preferred ?? i.name ?? '',
    description: i.full_address ?? i.place_formatted ?? '',
  }));
}

export async function retrievePlace(
  mapboxId: string,
  sessionToken: string,
): Promise<GeocodeResult> {
  if (!TOKEN) throw new Error('Mapbox token missing');
  const url = new URL(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}`,
  );
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('session_token', sessionToken);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Retrieve failed (${r.status})`);
  const data = await r.json();
  const f = data.features?.[0];
  if (!f?.geometry?.coordinates) throw new Error('Place not found');
  const props = f.properties ?? {};
  const name = props.name_preferred ?? props.name;
  const address = props.full_address ?? props.place_formatted;
  const label = name && address ? `${name} — ${address}` : (name ?? address ?? '');
  return { coords: f.geometry.coordinates as Coords, label };
}

export async function geocodeDestination(
  query: string,
  proximity: Coords,
): Promise<GeocodeResult> {
  if (!TOKEN) throw new Error('Mapbox token missing');
  const url = new URL('https://api.mapbox.com/search/searchbox/v1/forward');
  url.searchParams.set('q', query);
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('limit', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('proximity', `${proximity[0]},${proximity[1]}`);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Search failed (${r.status})`);
  const data = await r.json();
  const f = data.features?.[0];
  if (!f?.geometry?.coordinates) throw new Error(`Couldn't find "${query}"`);
  const props = f.properties ?? {};
  const name = props.name_preferred ?? props.name;
  const address = props.full_address ?? props.place_formatted;
  const label = name && address ? `${name} — ${address}` : (name ?? address ?? query);
  return { coords: f.geometry.coordinates as Coords, label };
}

export interface WalkingRoute {
  geometry: GeoJSON.LineString;
  distanceMeters: number;
  summary: string;
  streetNames: string[];
}

interface MapboxStep {
  name?: string;
}

interface MapboxLeg {
  summary?: string;
  steps?: MapboxStep[];
}

interface MapboxRoute {
  geometry: GeoJSON.LineString;
  distance: number;
  legs?: MapboxLeg[];
}

interface BiasParams {
  walkway_bias?: number;
  alley_bias?: number;
}

async function fetchWalkingRoutes(
  origin: Coords,
  destination: Coords,
  opts: { alternatives?: boolean } & BiasParams,
): Promise<WalkingRoute[]> {
  if (!TOKEN) throw new Error('Mapbox token missing');
  const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/walking/${coords}`);
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('overview', 'full');
  url.searchParams.set('steps', 'true');
  url.searchParams.set('exclude', 'ferry');
  if (opts.alternatives) url.searchParams.set('alternatives', 'true');
  if (opts.walkway_bias !== undefined) {
    url.searchParams.set('walkway_bias', String(opts.walkway_bias));
  }
  if (opts.alley_bias !== undefined) {
    url.searchParams.set('alley_bias', String(opts.alley_bias));
  }
  const r = await fetch(url);
  const data = await r.json().catch(() => null);
  if (!r.ok || (data && data.code && data.code !== 'Ok')) {
    const code = data?.code ?? r.status;
    const message = data?.message ?? 'unknown error';
    console.error('[directions]', { status: r.status, code, message, origin, destination, data });
    if (code === 'NoRoute') throw new Error('No walking route between you and that place');
    if (code === 'NoSegment') throw new Error("Couldn't snap to a road near you or the destination");
    if (code === 'InvalidInput') throw new Error(`Mapbox rejected the request: ${message}`);
    throw new Error(`Directions failed: ${message} (${code})`);
  }
  const routes = (data?.routes ?? []) as MapboxRoute[];
  return routes.map((route) => {
    const legs = route.legs ?? [];
    const stepNames: string[] = [];
    const seen = new Set<string>();
    for (const leg of legs) {
      for (const step of leg.steps ?? []) {
        const n = step.name?.trim();
        if (n && !seen.has(n)) {
          seen.add(n);
          stepNames.push(n);
        }
      }
    }
    const summaries = legs.map((l) => l.summary?.trim()).filter(Boolean) as string[];
    const summary = summaries.length > 0 ? summaries.join(' / ') : stepNames.slice(0, 4).join(', ');
    return {
      geometry: route.geometry,
      distanceMeters: route.distance,
      summary,
      streetNames: stepNames,
    };
  });
}

function dedupeRoutes(routes: WalkingRoute[]): WalkingRoute[] {
  const out: WalkingRoute[] = [];
  for (const r of routes) {
    const isDuplicate = out.some(
      (existing) =>
        Math.abs(existing.distanceMeters - r.distanceMeters) < 50 &&
        existing.streetNames.slice(0, 5).join('|') === r.streetNames.slice(0, 5).join('|'),
    );
    if (!isDuplicate) out.push(r);
  }
  return out;
}

export async function getWalkingDirections(
  origin: Coords,
  destination: Coords,
  options: { generateVariants?: boolean } = {},
): Promise<WalkingRoute[]> {
  if (!options.generateVariants) {
    const routes = await fetchWalkingRoutes(origin, destination, { alternatives: true });
    if (routes.length === 0) throw new Error('No walkable route found');
    return routes;
  }

  const calls = await Promise.all([
    fetchWalkingRoutes(origin, destination, { alternatives: true }),
    fetchWalkingRoutes(origin, destination, { walkway_bias: 1 }).catch(() => []),
    fetchWalkingRoutes(origin, destination, { walkway_bias: 0.5, alley_bias: 0.5 }).catch(
      () => [],
    ),
  ]);

  const all = dedupeRoutes(calls.flat());
  if (all.length === 0) throw new Error('No walkable route found');
  return all.slice(0, 3);
}
