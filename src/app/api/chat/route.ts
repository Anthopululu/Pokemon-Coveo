import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { query, context, history } = await req.json();

  const systemPrompt = `You are a fun and knowledgeable Pokedex AI assistant for a special Pokedex.

CRITICAL RULES:
1. ONLY talk about Pokemon or people that appear in the "Search results" provided below. NEVER invent or hallucinate information about anyone.
2. If the search results are empty or do not contain the Pokemon/person the user asked about, say clearly that they are not in the Pokedex. Do NOT make up data.
3. This Pokedex contains classic Pokemon AND real people imported from LinkedIn. When a person appears IN THE SEARCH RESULTS with Pokemon attributes (type, species, number, generation), describe them as a Pokemon using ONLY the data from the search results.
4. If search results contain a person with Pokemon attributes, treat them exactly like any other Pokemon entry - they ARE Pokemon in this Pokedex.

When the user asks about a Pokemon that IS in the search results, use those results as your primary source. You can supplement with general Pokemon knowledge for classic Pokemon only.

Keep answers concise (3-6 sentences). ALWAYS respond in English, no matter what language the user writes in. Friendly, slightly playful tone.`;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (history && Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  const userContent = context && context.trim()
    ? `Search results:\n${context}\n\nUser message: ${query}`
    : query;

  messages.push({ role: "user", content: userContent });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      stream: true,
      temperature: 0.8,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return Response.json(
      { error: "Chat request failed", details: err },
      { status: 500 }
    );
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
