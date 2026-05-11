'use client';

import { useRef, useState } from 'react';
import BottomNav from './components/BottomNav';
import DiscoverScreen from './components/screens/DiscoverScreen';
import DesignScreen from './components/screens/DesignScreen';
import RoutesScreen from './components/screens/RoutesScreen';
import LiveRunScreen from './components/screens/LiveRunScreen';
import SummaryScreen from './components/screens/SummaryScreen';
import SavedScreen from './components/screens/SavedScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import {
  DesignParams,
  GeneratedRoute,
  MOOD_OPTIONS,
  Mode,
  Tab,
  defaultDesignParams,
  paceSecondsPerKm,
  prefsToPromptString,
} from './lib/screen-state';
import {
  Coords,
  POI,
  WalkingRoute,
  getCurrentPosition,
  getWalkingDirections,
  routeWaypoints,
  searchPOIs,
} from './lib/mapbox';

const ROUTE_NAMES = ['The Canal Loop', 'Park Hopper', 'Hill Reward'];
const ROUTE_SEEDS = [33, 64, 12];

interface FinishStats {
  elapsedSeconds: number;
  distanceKm: number;
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

function buildMockRoutes(params: DesignParams): GeneratedRoute[] {
  const baseKm = params.distance;
  const paceSec = paceSecondsPerKm(params.pace);
  const offsets = [0, 0.6, -0.4];
  const elevations = [18, 24, 86];
  const offroads = [72, 58, 30];
  const rationales = [
    'Hugs the canal towpath for 80% of the run, finishes near a coffee stop.',
    'Chains three local parks with quiet residential connectors between them.',
    'Two punchy climbs through the back streets, then a downhill cooldown to finish.',
  ];
  return ROUTE_NAMES.map((name, i) => {
    const km = Math.max(1, baseKm + offsets[i]);
    return {
      id: `mock-${i}`,
      name,
      seed: ROUTE_SEEDS[i],
      distanceMeters: km * 1000,
      durationSeconds: km * paceSec,
      rationale: rationales[i],
      geometry: null,
      origin: null,
      destination: null,
      destinationLabel: '',
      elevationMeters: elevations[i],
      offroadPct: offroads[i],
      source: null,
      isRecommended: i === 0,
    };
  });
}

interface PlannedLoop {
  name: string;
  rationale: string;
  waypointIds: string[];
}

async function planLoopsWithClaude(args: {
  prefs: string;
  mood: string | null;
  targetKm: number;
  pois: POI[];
}): Promise<PlannedLoop[]> {
  const r = await fetch('/api/plan-loops', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) {
    const data = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Loop planner failed (${r.status})`);
  }
  const data = (await r.json()) as { loops: PlannedLoop[] };
  return data.loops;
}

async function buildLoopRoutes(params: DesignParams): Promise<GeneratedRoute[]> {
  const origin = await getCurrentPosition();
  const targetKm = params.distance;
  const radiusKm = Math.max(0.5, targetKm * 0.45);

  const pois = await searchPOIs(origin, ['park', 'coffee'], radiusKm);
  if (pois.length < 3) {
    throw new Error('Not enough places nearby to design a loop — try a smaller distance or set a destination');
  }

  const moodLabel = params.mood ? MOOD_OPTIONS.find((m) => m.id === params.mood)?.label ?? null : null;
  const loops = await planLoopsWithClaude({
    prefs: prefsToPromptString(params.prefs),
    mood: moodLabel,
    targetKm,
    pois,
  });

  const paceSec = paceSecondsPerKm(params.pace);
  const fallbackSeeds = [33, 64, 12];
  const fallbackElevation = [18, 24, 86];
  const fallbackOffroad = [72, 58, 30];

  const settled = await Promise.allSettled(
    loops.map(async (loop) => {
      const waypoints = loop.waypointIds
        .map((id) => pois.find((p) => p.id === id)?.coords)
        .filter((c): c is Coords => Array.isArray(c));
      if (waypoints.length === 0) throw new Error('No valid waypoints');
      const rt = await routeWaypoints(origin, waypoints);
      return { loop, rt };
    }),
  );

  const candidates = settled
    .map((s, i) => (s.status === 'fulfilled' ? { ...s.value, index: i } : null))
    .filter((c): c is { loop: PlannedLoop; rt: WalkingRoute; index: number } => c !== null);

  if (candidates.length === 0) {
    throw new Error('Could not route any of the planned loops');
  }

  // Drop loops that are wildly off-target (>50% off), then sort by closeness.
  const filtered = candidates.filter(
    ({ rt }) => Math.abs(rt.distanceMeters / 1000 - targetKm) / targetKm <= 0.5,
  );
  const pick = (filtered.length > 0 ? filtered : candidates).sort(
    (a, b) =>
      Math.abs(a.rt.distanceMeters / 1000 - targetKm) - Math.abs(b.rt.distanceMeters / 1000 - targetKm),
  );

  return pick.map((c, i) => {
    const km = c.rt.distanceMeters / 1000;
    return {
      id: `loop-${c.index}`,
      name: c.loop.name,
      seed: fallbackSeeds[i] ?? 33,
      distanceMeters: c.rt.distanceMeters,
      durationSeconds: km * paceSec,
      rationale: c.loop.rationale,
      geometry: c.rt.geometry,
      origin,
      destination: origin,
      destinationLabel: 'back at your start',
      elevationMeters: fallbackElevation[i] ?? 30,
      offroadPct: fallbackOffroad[i] ?? 50,
      source: c.rt,
      isRecommended: i === 0,
    };
  });
}

async function buildRealRoutes(params: DesignParams): Promise<GeneratedRoute[]> {
  if (!params.destination) throw new Error('NO_DEST');
  const origin = await getCurrentPosition();
  const dest = params.destination.coords;
  const preferenceString = prefsToPromptString(params.prefs);
  const routes = await getWalkingDirections(origin, dest, {
    generateVariants: preferenceString.length > 0,
  });
  if (routes.length === 0) throw new Error('No walking route found between you and that place');

  let chosenIndex = 0;
  let recommendedReasoning: string | null = null;
  const consideredRoutes = routes.slice(0, 3);
  if (preferenceString && consideredRoutes.length >= 2) {
    try {
      const pick = await pickRouteWithClaude(preferenceString, consideredRoutes);
      if (
        typeof pick.chosenIndex === 'number' &&
        Number.isInteger(pick.chosenIndex) &&
        pick.chosenIndex >= 0 &&
        pick.chosenIndex < consideredRoutes.length
      ) {
        chosenIndex = pick.chosenIndex;
        recommendedReasoning = pick.reasoning;
      } else {
        console.warn('[pick-route] chosenIndex out of bounds, defaulting to 0', pick);
      }
    } catch (e) {
      console.error('[pick-route]', e);
    }
  }

  const paceSec = paceSecondsPerKm(params.pace);
  const surfaceLabels = ['Canal & towpath mix', 'Park-to-park chain', 'Hilly back-street route'];

  return consideredRoutes.map((rt, i) => {
    const km = rt.distanceMeters / 1000;
    const isRecommended = i === chosenIndex;
    return {
      id: `real-${i}`,
      name: surfaceLabels[i] ?? ROUTE_NAMES[i] ?? `Route ${i + 1}`,
      seed: ROUTE_SEEDS[i] ?? 33,
      distanceMeters: rt.distanceMeters,
      durationSeconds: km * paceSec,
      rationale:
        isRecommended && recommendedReasoning
          ? recommendedReasoning
          : `Via ${rt.streetNames.slice(0, 3).join(', ')}${rt.streetNames.length > 3 ? '…' : ''}`,
      geometry: rt.geometry,
      origin,
      destination: dest,
      destinationLabel: params.destination?.label ?? '',
      elevationMeters: [18, 24, 86][i] ?? 20,
      offroadPct: [72, 58, 30][i] ?? 50,
      source: rt,
      isRecommended,
    };
  });
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('discover');
  const [mode, setMode] = useState<Mode>(null);
  const [designParams, setDesignParams] = useState<DesignParams>(defaultDesignParams());
  const [routes, setRoutes] = useState<GeneratedRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [chosenRoute, setChosenRoute] = useState<GeneratedRoute | null>(null);
  const [finishStats, setFinishStats] = useState<FinishStats>({ elapsedSeconds: 0, distanceKm: 0 });
  const generationIdRef = useRef(0);

  const goToDiscover = () => {
    setTab('discover');
    setMode(null);
  };

  const handleGenerate = async (params: DesignParams) => {
    const myId = ++generationIdRef.current;
    setDesignParams(params);
    setMode('routes');
    setRoutesLoading(true);
    setRoutesError(null);
    setRoutes([]);
    try {
      const result = params.destination ? await buildRealRoutes(params) : await buildLoopRoutes(params);
      if (myId !== generationIdRef.current) return; // a newer call superseded this one
      setRoutes(result);
    } catch (e) {
      if (myId !== generationIdRef.current) return;
      const msg = e instanceof Error ? e.message : 'Could not generate routes';
      setRoutesError(msg);
      setRoutes(buildMockRoutes(params));
    } finally {
      if (myId === generationIdRef.current) setRoutesLoading(false);
    }
  };

  const renderScreen = () => {
    if (mode === 'live' && chosenRoute) {
      return (
        <LiveRunScreen
          route={chosenRoute}
          onFinish={(stats) => {
            setFinishStats(stats);
            setMode('summary');
          }}
        />
      );
    }
    if (mode === 'summary' && chosenRoute) {
      return (
        <SummaryScreen
          route={chosenRoute}
          elapsedSeconds={finishStats.elapsedSeconds}
          distanceKm={finishStats.distanceKm}
          onDone={goToDiscover}
        />
      );
    }
    if (mode === 'routes') {
      return (
        <div className="anim-slideInRight">
          <RoutesScreen
            routes={routes}
            loading={routesLoading}
            error={routesError}
            onBack={() => {
              setMode(null);
              setTab('design');
            }}
            onStart={(r) => {
              setChosenRoute(r);
              setMode('live');
            }}
          />
        </div>
      );
    }
    if (tab === 'design') {
      return (
        <div className="anim-slideInRight">
          <DesignScreen
            initial={designParams}
            onBack={() => setTab('discover')}
            onGenerate={handleGenerate}
          />
        </div>
      );
    }
    if (tab === 'saved') {
      return (
        <div className="anim-fadeIn">
          <SavedScreen />
        </div>
      );
    }
    if (tab === 'profile') {
      return (
        <div className="anim-fadeIn">
          <ProfileScreen />
        </div>
      );
    }
    return (
      <div className="anim-fadeIn">
        <DiscoverScreen onOpenRoute={() => setTab('design')} />
      </div>
    );
  };

  const isLive = mode === 'live';
  const showNav = mode !== 'live';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: isLive ? '#0F1E18' : 'var(--color-bg, #FAF7F2)',
        color: 'var(--color-ink, #1A1A1A)',
      }}
    >
      <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>{renderScreen()}</div>
      {showNav && (
        <BottomNav
          tab={tab}
          onTabChange={(t) => {
            setTab(t);
            setMode(null);
          }}
          onRun={() => {
            setTab('design');
            setMode(null);
          }}
        />
      )}
    </main>
  );
}
