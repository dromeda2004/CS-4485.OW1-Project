export async function fetchOpenAIResponse(prompt) {
  try {
    const response = await fetch('https://aua7cqvtfe.execute-api.us-east-1.amazonaws.com/prod/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;  // The AI-generated text from Lambda
  } catch (error) {
    console.error('Failed to fetch OpenAI response:', error);
    return null;
  }
}
