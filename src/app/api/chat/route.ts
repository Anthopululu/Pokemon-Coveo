import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { query, context } = await req.json();

  const systemPrompt = `You are a Pokedex AI assistant. Answer questions about Pokemon based ONLY on the provided search results. Be concise (2-4 sentences max). Always mention the Pokemon's name, number, and type when relevant. If the results don't have enough info, say so briefly. Respond in the same language as the user's query.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Search results:\n${context}\n\nQuestion: ${query}`,
        },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 300,
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
