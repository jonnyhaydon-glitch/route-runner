'use client';

import { useCallback, useState } from 'react';
import Map from './components/Map';
import {
  Coords,
  formatClockTime,
  formatDuration,
  geocodeDestination,
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
}

const CARD_SHADOW =
  'shadow-[0_4px_0_0_#3da95c33,0_8px_24px_-8px_rgba(61,169,92,0.15)]';

export default function Home() {
  const [destination, setDestination] = useState('');
  const [pace, setPace] = useState('5:30');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);

  const onPlan = useCallback(async () => {
    setError(null);
    if (!destination.trim()) {
      setError('Enter a destination');
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
      const { coords: dest, label } = await geocodeDestination(destination.trim(), origin);
      const { geometry, distanceMeters } = await getWalkingDirections(origin, dest);
      const durationSeconds = (distanceMeters / 1000) * paceSecs;
      setResult({
        origin,
        destination: dest,
        destinationLabel: label,
        geometry,
        distanceMeters,
        durationSeconds,
        arrivalTime: new Date(Date.now() + durationSeconds * 1000),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setResult(null);
    } finally {
      setBusy(false);
    }
  }, [destination, pace]);

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
        <section className={`bg-white rounded-2xl p-5 ${CARD_SHADOW}`}>
          <label className="block text-xs font-bold text-[#3da95c] uppercase tracking-widest mb-2">
            Destination
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="THE CROWN, BATTERSEA"
            className="w-full text-lg uppercase tracking-wide bg-transparent outline-none placeholder:text-[#1a1a1a]/30"
          />
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
