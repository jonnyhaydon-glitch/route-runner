import Anthropic from '@anthropic-ai/sdk';
import { isOriginAllowed, sanitizeUserText } from '../../lib/api-guard';

interface POIIn {
  id: string;
  name: string;
  category: string;
  distanceKm: number;
  bearingDeg: number;
}

interface PlanLoopsIn {
  prefs: string;
  mood: string | null;
  targetKm: number;
  pois: POIIn[];
}

const SYSTEM_PROMPT = `You plan 3 distinct running loops for a user.

You receive:
- A target distance in km.
- Optional preferences (e.g. parks, rivers, quiet streets, hills, flat, avoid traffic).
- Optional mood phrase (e.g. "Need a reset", "Push myself").
- A list of nearby POIs, each with id, name, category, distance-from-start in km, and bearing-from-start in degrees (0=N, 90=E).

Plan exactly 3 loops that all start and end at the runner's current location. For each loop choose 1 to 3 POI waypoints (no more) that the route should pass through, in order. The output array MUST contain exactly 3 entries. The waypoint distances and bearings let you reason about geometry: a single waypoint creates an out-and-back; two waypoints in different bearings create a triangle; three waypoints can form a varied loop.

Rules:
- Total straight-line distance of the loop should roughly match the target. A 2-waypoint loop has length ~ (d1 + chord(wp1,wp2) + d2). A reasonable approximation is 2 × (average POI distance) × 2.5, so choose waypoints whose distances are roughly target_km / 4. Adjust if the user wants hills (slightly shorter, more elevation) or flat (slightly longer).
- The 3 loops must be visually distinct. Use waypoints in different parts of the compass (e.g. loop A goes NE, loop B goes SW, loop C goes S/SE).
- Match preferences and mood: if "Parks" is requested, prefer park waypoints; if "Push myself", pick farther / more varied waypoints; if "Need a reset", prefer parks and quieter areas.
- Each loop needs a short, evocative name (3-5 words) and a one-sentence rationale (<25 words) explaining why this loop fits the user.
- Use only POI ids from the provided list. Do not invent ids.`;

const planLoopsSchema = {
  type: 'object',
  properties: {
    loops: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          rationale: { type: 'string' },
          waypointIds: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['name', 'rationale', 'waypointIds'],
        additionalProperties: false,
      },
    },
  },
  required: ['loops'],
  additionalProperties: false,
};

function formatPOIs(pois: POIIn[]): string {
  return pois
    .map(
      (p) =>
        `- ${p.id} · ${p.name} · ${p.category} · ${p.distanceKm.toFixed(2)} km · bearing ${Math.round(p.bearingDeg)}°`,
    )
    .join('\n');
}

export async function POST(request: Request) {
  if (!isOriginAllowed(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'Server is missing ANTHROPIC_API_KEY' }, { status: 500 });
  }

  let body: PlanLoopsIn;
  try {
    body = (await request.json()) as PlanLoopsIn;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { targetKm, pois } = body;
  const prefs = sanitizeUserText(body.prefs, 400);
  const mood = body.mood ? sanitizeUserText(body.mood, 80) : null;
  if (typeof targetKm !== 'number' || targetKm <= 0 || targetKm > 50) {
    return Response.json({ error: 'targetKm must be between 0 and 50' }, { status: 400 });
  }
  if (!Array.isArray(pois) || pois.length < 3) {
    return Response.json({ error: 'pois must contain at least 3 entries' }, { status: 400 });
  }
  if (pois.length > 60) {
    return Response.json({ error: 'too many pois' }, { status: 400 });
  }

  const client = new Anthropic();

  const userMessage = [
    `Target distance: ${targetKm.toFixed(1)} km`,
    prefs ? `Preferences: ${prefs}` : 'Preferences: none specified',
    mood ? `Mood: ${mood}` : 'Mood: not specified',
    '',
    'Nearby POIs:',
    formatPOIs(pois),
  ].join('\n');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      thinking: { type: 'disabled' },
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: planLoopsSchema },
      },
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    });

    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      return Response.json({ error: 'No text response from Claude' }, { status: 502 });
    }
    const parsed = JSON.parse(block.text) as {
      loops: Array<{ name: string; rationale: string; waypointIds: string[] }>;
    };
    return Response.json(parsed);
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error('[plan-loops] Anthropic error', e.status, e.message);
      return Response.json({ error: `Claude API: ${e.message}` }, { status: e.status ?? 502 });
    }
    console.error('[plan-loops]', e);
    return Response.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
