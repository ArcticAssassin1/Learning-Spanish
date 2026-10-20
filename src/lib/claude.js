// Shared Claude API call for the AI features (Fix my sentence, Quick translate).
// Runs in the browser with the learner's own API key, which is stored only on their device.

export const MODEL = 'claude-opus-5-5';

export function looksLikeApiKey(key) {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

/**
 * One structured-output request.
 * @param {{ apiKey: string, system: string, user: string, schema: object, parse: (text: string) => any,
 *           signal?: AbortSignal, what?: string }} opts
 * @returns {Promise<{ result?: any, error?: string }>} error is a friendly message for the UI ('' = cancelled).
 */
export async function askClaude({ apiKey, system, user, schema, parse, signal, what = 'this' }) {
  if (!apiKey) return { error: 'Add your Claude API key in Settings first.' };

  // Loaded only when an AI feature is used, so the rest of the app stays small.
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });

  try {
    const response = await client.beta.messages.create(
      {
        model: MODEL,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema } },
        system,
        messages: [{ role: 'user', content: user }],
      },
      { signal },
    );

    if (response.stop_reason === 'refusal') return { error: `Claude couldn't do ${what}. Try rewording it.` };
    if (response.stop_reason === 'max_tokens') return { error: 'The answer got cut off. Try something shorter.' };
    const block = response.content.find((b) => b.type === 'text');
    if (!block) return { error: 'No answer came back. Try again.' };
    return { result: parse(block.text) };
  } catch (e) {
    if (e instanceof Anthropic.APIUserAbortError) return { error: '' };
    if (e instanceof Anthropic.AuthenticationError) return { error: 'Your API key was rejected. Check it in Settings.' };
    if (e instanceof Anthropic.PermissionDeniedError) return { error: "This API key isn't allowed to use Claude. Check it in the Claude Console." };
    if (e instanceof Anthropic.RateLimitError) return { error: 'Too many requests (or the key is out of credit). Wait a bit and try again.' };
    if (e instanceof Anthropic.APIConnectionError) return { error: 'No connection. This feature needs internet.' };
    if (e instanceof Anthropic.APIError) return { error: `Claude had a problem (${e.status ?? 'error'}). Try again.` };
    if (e instanceof SyntaxError || e?.message === 'bad shape') return { error: 'The answer came back garbled. Try again.' };
    return { error: 'Something went wrong. Try again.' };
  }
}

/** Escape text placed inside an XML-style tag in a prompt. */
export function escapeTag(text) {
  return text.replace(/</g, '‹').replace(/>/g, '›');
}
