import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock environment variables
vi.stubEnv("COVEO_ORG_ID", "test-org");
vi.stubEnv("COVEO_API_KEY", "test-key");
vi.stubEnv("COVEO_SOURCE_ID", "test-source");
vi.stubEnv("BRIGHT_DATA_API_TOKEN", "test-bright-data");
vi.stubEnv("ADMIN_TOKEN", "test-secret-token");

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("/api/linkedin/add", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 401 without auth token", async () => {
      const { POST } = await import("@/app/api/linkedin/add/route");

      const req = new Request("http://localhost/api/linkedin/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://www.linkedin.com/in/test-user/" }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 with wrong auth token", async () => {
      const { POST } = await import("@/app/api/linkedin/add/route");

      const req = new Request("http://localhost/api/linkedin/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer wrong-token",
        },
        body: JSON.stringify({ url: "https://www.linkedin.com/in/test-user/" }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid LinkedIn URL", async () => {
      const { POST } = await import("@/app/api/linkedin/add/route");

      const req = new Request("http://localhost/api/linkedin/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-secret-token",
        },
        body: JSON.stringify({ url: "https://www.google.com" }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("LinkedIn");
    });

    it("returns 400 for missing URL", async () => {
      const { POST } = await import("@/app/api/linkedin/add/route");

      const req = new Request("http://localhost/api/linkedin/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-secret-token",
        },
        body: JSON.stringify({}),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE", () => {
    it("returns 401 without auth token", async () => {
      const { DELETE } = await import("@/app/api/linkedin/add/route");

      const req = new Request("http://localhost/api/linkedin/add", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: "test-id" }),
      });

      const res = await DELETE(req as any);
      expect(res.status).toBe(401);
    });

    it("returns 400 for missing documentId", async () => {
      const { DELETE } = await import("@/app/api/linkedin/add/route");

      const req = new Request("http://localhost/api/linkedin/add", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-secret-token",
        },
        body: JSON.stringify({}),
      });

      const res = await DELETE(req as any);
      expect(res.status).toBe(400);
    });

    it("calls Coveo delete API with valid request", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const { DELETE } = await import("@/app/api/linkedin/add/route");

      const req = new Request("http://localhost/api/linkedin/add", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-secret-token",
        },
        body: JSON.stringify({ documentId: "https://linkedin.com/in/test" }),
      });

      const res = await DELETE(req as any);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("coveo.com/push/v1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
