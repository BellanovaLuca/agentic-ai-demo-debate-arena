import { generate } from '../lib/gemini';
import { parseLlmJson } from '../lib/jsonParse';
import { buildPositionAssignmentPrompt } from '../agents/prompts';

interface RawPositions {
  optimist?: unknown;
  skeptic?: unknown;
}

export async function assignPositions(topic: string): Promise<{
  optimist: string;
  skeptic: string;
}> {
  const { systemInstruction, userPrompt } = buildPositionAssignmentPrompt({ topic });
  const { text } = await generate({
    systemInstruction,
    userPrompt,
    jsonOutput: true,
    temperature: 0.5,
    timeoutMs: 30_000,
  });

  const parsed = parseLlmJson<RawPositions>(text);
  const optimist =
    typeof parsed.optimist === 'string' && parsed.optimist.trim().length > 0
      ? parsed.optimist.trim()
      : null;
  const skeptic =
    typeof parsed.skeptic === 'string' && parsed.skeptic.trim().length > 0
      ? parsed.skeptic.trim()
      : null;
  if (!optimist || !skeptic) {
    throw new Error(
      'assegnazione posizioni fallita: output del moderatore incompleto.',
    );
  }
  return { optimist, skeptic };
}
