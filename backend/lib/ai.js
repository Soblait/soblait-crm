// Thin wrapper around the Anthropic Messages API for the AI Tools hub.
//
// Requires an ANTHROPIC_API_KEY environment variable on the backend (set it in Render ->
// this service -> Environment). If it's missing, we throw a friendly, clearly-labeled error
// instead of crashing, so the rest of the app keeps working and the UI can show a helpful
// message rather than a generic 500.
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';

class AiNotConfiguredError extends Error {
  constructor() {
    super('AI Tools aren\'t connected yet. Add an ANTHROPIC_API_KEY environment variable to the backend on Render, then redeploy.');
    this.code = 'AI_NOT_CONFIGURED';
  }
}

async function callClaude(systemPrompt, userPrompt, { maxTokens = 1000 } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AiNotConfiguredError();
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    const err = new Error(`AI request failed (${response.status}): ${bodyText.slice(0, 300)}`);
    err.code = 'AI_REQUEST_FAILED';
    throw err;
  }

  const data = await response.json();
  const text = (data.content || [])
    .map((block) => block.text || '')
    .join('\n')
    .trim();
  return text;
}

module.exports = { callClaude, AiNotConfiguredError };
