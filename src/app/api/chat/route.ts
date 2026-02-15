import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { query, context, history } = await req.json();

  const systemPrompt = `You are a fun and knowledgeable Pokedex AI assistant. You know everything about Pokemon.

When the user asks about Pokemon, use the search results provided as your primary source, but you can also use your general Pokemon knowledge to give richer, more complete answers. Mention Pokemon names, numbers, and types when relevant.

When the user says something casual, off-topic, or rude, respond naturally like a friendly assistant would. You can joke around, but always try to steer the conversation back to Pokemon.

Keep answers concise but helpful (3-6 sentences). Match the user's language (French, English, etc.). Use a friendly, slightly playful tone.`;

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
      { error: "LLM request failed", details: err },
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
