import Anthropic from '@anthropic-ai/sdk';

interface AlternativeIn {
  summary: string;
  streetNames: string[];
  distanceMeters: number;
}

interface PickRouteIn {
  preference: string;
  alternatives: AlternativeIn[];
}

const SYSTEM_PROMPT = `You pick the best running route from a small set of alternatives, given a user's natural-language preference.

You will receive:
- A short preference like "run through parks", "riverside route", "avoid main roads", or "take the scenic way".
- 2-3 candidate routes. Each has a Mapbox-provided summary, a list of street/way names traversed in order, and total walking distance.

Use the street names to infer route character. Names like "Park Road", "Embankment", "Riverside Walk", "Common", "Heath", "Gardens" suggest green or waterside routes; names with "High Street", "Bridge Road", "A-something" or motorway-style identifiers suggest busier traffic. You don't have ground-truth on every street, so make a best-guess judgement and lean toward the route whose names most align with the preference.

If the preference is vague or doesn't clearly favour any candidate, prefer the shortest route by default but say so in your reasoning.

Respond with the index of the chosen route (0-based) and one short sentence (under 25 words) explaining why. Be specific about which street(s) drove the decision when possible.`;

function pickRouteSchema(altCount: number) {
  const validIndices = Array.from({ length: altCount }, (_, i) => i);
  return {
    type: 'object',
    properties: {
      chosenIndex: { type: 'integer', enum: validIndices },
      reasoning: { type: 'string' },
    },
    required: ['chosenIndex', 'reasoning'],
    additionalProperties: false,
  };
}

function formatRoutes(alts: AlternativeIn[]): string {
  return alts
    .map((a, i) => {
      const km = (a.distanceMeters / 1000).toFixed(2);
      const names = a.streetNames.slice(0, 15).join(', ');
      return `Route ${i}: ${km} km · summary: ${a.summary}\n  streets: ${names}`;
    })
    .join('\n\n');
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'Server is missing ANTHROPIC_API_KEY' }, { status: 500 });
  }

  let body: PickRouteIn;
  try {
    body = (await request.json()) as PickRouteIn;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const preference = body.preference?.trim() ?? '';
  const alternatives = body.alternatives ?? [];
  if (preference.length === 0 || preference.length > 300) {
    return Response.json({ error: 'preference must be 1-300 chars' }, { status: 400 });
  }
  if (!Array.isArray(alternatives) || alternatives.length < 2 || alternatives.length > 3) {
    return Response.json({ error: 'alternatives must contain 2-3 routes' }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: pickRouteSchema(alternatives.length) },
      },
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Preference: ${preference}\n\n${formatRoutes(alternatives)}`,
        },
      ],
    });

    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      return Response.json({ error: 'No text response from Claude' }, { status: 502 });
    }
    const parsed = JSON.parse(block.text) as { chosenIndex: number; reasoning: string };
    return Response.json(parsed);
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error('[pick-route] Anthropic error', e.status, e.message);
      return Response.json({ error: `Claude API: ${e.message}` }, { status: e.status ?? 502 });
    }
    console.error('[pick-route]', e);
    return Response.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
