'use client';

import { useCallback, useState } from 'react';
import DestinationSearch from './components/DestinationSearch';
import Map from './components/Map';
import {
  Coords,
  GeocodeResult,
  WalkingRoute,
  formatClockTime,
  formatDuration,
  getCurrentPosition,
  getWalkingDirections,
  parsePaceToSecondsPerKm,
} from './lib/mapbox';

interface RouteResult {
  origin: Coords;
  destination: Coords;
  destinationLabel: string;
  geometry: GeoJSON.LineString;
  distanceMeters: number;
  durationSeconds: number;
  arrivalTime: Date;
  reasoning: string | null;
  alternativesCount: number;
  chosenIndex: number;
}

async function pickRouteWithClaude(
  preference: string,
  routes: WalkingRoute[],
): Promise<{ chosenIndex: number; reasoning: string }> {
  const r = await fetch('/api/pick-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preference,
      alternatives: routes.map((rt) => ({
        summary: rt.summary,
        streetNames: rt.streetNames,
        distanceMeters: rt.distanceMeters,
      })),
    }),
  });
  if (!r.ok) {
    const data = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Route picker failed (${r.status})`);
  }
  return r.json();
}

const CARD_SHADOW =
  'shadow-[0_4px_0_0_#3da95c33,0_8px_24px_-8px_rgba(61,169,92,0.15)]';

const PREFERENCE_OPTIONS = [
  { id: 'parks', label: 'Through parks', prompt: 'Run through parks and green space.' },
  { id: 'riverside', label: 'Riverside', prompt: 'Stay close to the river or canal where possible.' },
  { id: 'avoid-main-roads', label: 'Avoid main roads', prompt: 'Avoid busy main roads and high streets.' },
  { id: 'quiet', label: 'Quiet streets', prompt: 'Prefer quiet residential streets over commercial ones.' },
] as const;

type PreferenceId = (typeof PREFERENCE_OPTIONS)[number]['id'];

export default function Home() {
  const [destPlace, setDestPlace] = useState<GeocodeResult | null>(null);
  const [pace, setPace] = useState('5:30');
  const [prefs, setPrefs] = useState<Set<PreferenceId>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);

  const togglePref = (id: PreferenceId) => {
    setPrefs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onPlan = useCallback(async () => {
    setError(null);
    if (!destPlace) {
      setError('Pick a destination from the suggestions');
      return;
    }
    const paceSecs = parsePaceToSecondsPerKm(pace);
    if (paceSecs === null) {
      setError('Pace must be M:SS, e.g. 5:30');
      return;
    }
    setBusy(true);
    try {
      const origin = await getCurrentPosition();
      const selectedPrompts = PREFERENCE_OPTIONS
        .filter((opt) => prefs.has(opt.id))
        .map((opt) => opt.prompt);
      const preferenceString = selectedPrompts.join(' ');
      const routes = await getWalkingDirections(origin, destPlace.coords, {
        generateVariants: preferenceString.length > 0,
      });

      let chosenIndex = 0;
      let reasoning: string | null = null;
      if (preferenceString) {
        if (routes.length < 2) {
          reasoning = `Only one walking route available — couldn't apply preferences.`;
        } else {
          try {
            const pick = await pickRouteWithClaude(preferenceString, routes);
            chosenIndex = pick.chosenIndex;
            reasoning = pick.reasoning;
          } catch (e) {
            reasoning = `Couldn't apply preferences: ${e instanceof Error ? e.message : 'unknown error'}`;
          }
        }
      }

      const route = routes[chosenIndex];
      const durationSeconds = (route.distanceMeters / 1000) * paceSecs;
      setResult({
        origin,
        destination: destPlace.coords,
        destinationLabel: destPlace.label,
        geometry: route.geometry,
        distanceMeters: route.distanceMeters,
        durationSeconds,
        arrivalTime: new Date(Date.now() + durationSeconds * 1000),
        reasoning,
        alternativesCount: routes.length,
        chosenIndex,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setResult(null);
    } finally {
      setBusy(false);
    }
  }, [destPlace, pace, prefs]);

  return (
    <main className="min-h-screen bg-[#f5f1ea] text-[#1a1a1a] flex flex-col font-semibold">
      <header className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold tracking-wide uppercase text-[#3da95c]">
          Route Runner
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#1a1a1a]/60 mt-1">
          Run there. Arrive on time.
        </p>
      </header>

      <div className="flex-1 px-6 pb-6 flex flex-col gap-5">
        <section className={`relative bg-white rounded-2xl p-5 z-20 ${CARD_SHADOW}`}>
          <label className="block text-xs font-bold text-[#3da95c] uppercase tracking-widest mb-2">
            Destination
          </label>
          <DestinationSearch onSelect={setDestPlace} />
        </section>

        <section className={`bg-white rounded-2xl p-5 ${CARD_SHADOW}`}>
          <label className="block text-xs font-bold text-[#3da95c] uppercase tracking-widest mb-2">
            Pace
          </label>
          <div className="flex items-baseline gap-3">
            <input
              type="text"
              value={pace}
              onChange={(e) => setPace(e.target.value)}
              className="text-3xl font-bold bg-transparent outline-none w-24"
            />
            <span className="text-xs uppercase tracking-widest text-[#1a1a1a]/60">Per Km</span>
          </div>
        </section>

        <section className={`bg-white rounded-2xl p-5 ${CARD_SHADOW}`}>
          <label className="block text-xs font-bold text-[#3da95c] uppercase tracking-widest mb-3">
            Preferences <span className="opacity-50 normal-case font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PREFERENCE_OPTIONS.map((opt) => {
              const active = prefs.has(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => togglePref(opt.id)}
                  className={
                    active
                      ? 'rounded-full px-4 py-2 text-xs uppercase tracking-widest font-bold bg-[#3da95c] text-white shadow-[0_2px_0_0_#2d8045]'
                      : 'rounded-full px-4 py-2 text-xs uppercase tracking-widest font-bold bg-transparent text-[#1a1a1a]/70 border border-[#1a1a1a]/15 hover:bg-[#3da95c]/10 hover:border-[#3da95c]/40'
                  }
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {result && (
          <section className="bg-[#3da95c] text-white rounded-2xl p-5 shadow-[0_4px_0_0_#2d8045,0_8px_24px_-8px_rgba(61,169,92,0.3)]">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Arrive at</p>
            <p className="text-4xl font-bold tracking-wide mt-1">
              {formatClockTime(result.arrivalTime)}
            </p>
            <p className="text-xs uppercase tracking-widest mt-2 opacity-80">
              {(result.distanceMeters / 1000).toFixed(2)} km · {formatDuration(result.durationSeconds)}
            </p>
            <p className="text-[10px] tracking-wide mt-3 opacity-70 normal-case font-normal">
              → {result.destinationLabel}
            </p>
            {result.reasoning && (
              <p className="text-xs leading-relaxed mt-3 opacity-90 normal-case font-normal italic">
                {result.reasoning}
              </p>
            )}
            {result.alternativesCount > 1 && (
              <p className="text-[10px] uppercase tracking-widest mt-2 opacity-60 font-normal">
                Picked {result.chosenIndex + 1} of {result.alternativesCount} routes
              </p>
            )}
          </section>
        )}

        {error && (
          <section className="bg-white rounded-2xl p-5 shadow-[0_4px_0_0_#dc262633,0_8px_24px_-8px_rgba(220,38,38,0.15)]">
            <p className="text-xs uppercase tracking-widest text-red-600 leading-relaxed">
              {error}
            </p>
          </section>
        )}

        <section
          className={`relative flex-1 bg-white rounded-2xl ${CARD_SHADOW} min-h-[300px] overflow-hidden`}
        >
          <Map
            origin={result?.origin}
            destination={result?.destination}
            route={result?.geometry}
          />
        </section>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onPlan}
            disabled={busy}
            className="bg-[#3da95c] text-white rounded-full py-3.5 px-10 text-sm uppercase tracking-widest font-bold shadow-[0_4px_0_0_#2d8045] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_#2d8045] active:translate-y-[2px] active:shadow-[0_2px_0_0_#2d8045] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? 'Planning…' : 'Plan My Route'}
          </button>
        </div>
      </div>

      <footer className="px-6 py-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-[#1a1a1a]/40">
          Powered by <span className="font-bold not-italic">KIWI</span>
          <span className="font-bold italic">RUNNERS</span>
        </p>
      </footer>
    </main>
  );
}
