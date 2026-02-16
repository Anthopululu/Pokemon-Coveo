import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("GROQ_API_KEY", "test-groq-key");

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("/api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends query and context to Groq API", async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n'));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n"));
        controller.close();
      },
    });
    mockFetch.mockResolvedValueOnce({ ok: true, body: mockStream });

    const { POST } = await import("@/app/api/chat/route");

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Tell me about Pikachu",
        context: "- Pikachu (#25): Electric type.",
        history: [],
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    // Verify Groq was called with correct structure
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-groq-key",
        }),
      })
    );

    // Verify the body includes system prompt and user message
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.messages[0].role).toBe("system");
    expect(callBody.messages[0].content).toContain("Pokedex");
    expect(callBody.messages[callBody.messages.length - 1].content).toContain("Pikachu");
    expect(callBody.stream).toBe(true);
  });

  it("returns 500 when Groq API fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Rate limit exceeded",
    });

    const { POST } = await import("@/app/api/chat/route");

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "test",
        context: "",
        history: [],
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe("Chat request failed");
  });

  it("includes conversation history in messages", async () => {
    const mockStream = new ReadableStream({
      start(controller) { controller.close(); },
    });
    mockFetch.mockResolvedValueOnce({ ok: true, body: mockStream });

    const { POST } = await import("@/app/api/chat/route");

    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "And its evolution?",
        context: "",
        history: [
          { role: "user", content: "Tell me about Pikachu" },
          { role: "assistant", content: "Pikachu is #25" },
        ],
      }),
    });

    await POST(req as any);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    // system + 2 history + user query = 4 messages
    expect(callBody.messages.length).toBe(4);
    expect(callBody.messages[1].content).toBe("Tell me about Pikachu");
    expect(callBody.messages[2].content).toBe("Pikachu is #25");
  });
});
