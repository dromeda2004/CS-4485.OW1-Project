export async function fetchOpenAIResponse(prompt, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      'https://aua7cqvtfe.execute-api.us-east-1.amazonaws.com/prod/openai',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      return { ok: false, error: `API error: ${response.status} ${response.statusText}` };
    }

    const data = await response.json();
    return { ok: true, result: data.result };
  } catch (error) {
    console.error('Failed to fetch OpenAI response:', error);
    const errorMsg = error.name === 'AbortError' ? 'Request timed out' : 'Network or server error';
    return { ok: false, error: errorMsg };
  } finally {
    clearTimeout(id);
  }
}
