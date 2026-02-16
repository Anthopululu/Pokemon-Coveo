"use client";

import { useState, useRef, useEffect } from "react";

const catchMessages = [
  "Throwing Pokeball...",
  "Scanning profile...",
  "Catching data...",
  "Almost there...",
  "Transferring to Pokedex...",
];

export default function AddLinkedIn() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [catchStep, setCatchStep] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const stepInterval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (status !== "loading") resetAndClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, status]);

  useEffect(() => {
    if (status === "loading") {
      setCatchStep(0);
      stepInterval.current = setInterval(() => {
        setCatchStep((s) => (s + 1) % catchMessages.length);
      }, 4000);
    } else {
      clearInterval(stepInterval.current);
    }
    return () => clearInterval(stepInterval.current);
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const linkedinUrl = url.trim();
    if (!linkedinUrl) return;

    setStatus("loading");
    setMessage("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
      if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;

      const res = await fetch("/api/linkedin/add", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: linkedinUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.profile) {
          let pending = JSON.parse(localStorage.getItem("pokedex-pending-linkedin") || "[]");
          pending = pending.filter((p: { documentId: string }) => p.documentId !== data.profile.documentId);
          pending.push({ ...data.profile, body: data.profile.data || "", addedAt: Date.now() });
          localStorage.setItem("pokedex-pending-linkedin", JSON.stringify(pending));

          try {
            const deleted: string[] = JSON.parse(localStorage.getItem("pokedex-deleted-linkedin") || "[]");
            const filtered = deleted.filter((id) => id !== data.profile.documentId);
            if (filtered.length !== deleted.length) {
              localStorage.setItem("pokedex-deleted-linkedin", JSON.stringify(filtered));
            }
          } catch {}
        }

        window.dispatchEvent(new CustomEvent("coveo-search", { detail: { name: data.name } }));
        resetAndClose();
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
      setUrl("");
      setCatchStep(0);
    }, 300);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => (isOpen ? resetAndClose() : setIsOpen(true))}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 text-white shadow-md coveo-gradient-btn"
      >
        <svg className="w-4 h-4" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6"/>
          <path d="M5 50 H95" stroke="currentColor" strokeWidth="6"/>
          <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="6"/>
        </svg>
        Catch Pokemon
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[360px] bg-dex-surface rounded-xl border border-dex-border/80 flex flex-col z-50 overflow-hidden shadow-2xl shadow-black/10 animate-slide-up">
          <div className="px-5 py-4 border-b border-dex-border/50 flex items-center gap-3 bg-dex-bg">
            <div className="w-8 h-8 rounded-full coveo-gradient flex items-center justify-center shadow-sm">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <div>
              <h3 className="text-sm font-syne font-bold text-dex-text">Catch from LinkedIn</h3>
              <p className="text-[10px] font-mono text-dex-text-muted">Add to your Pokedex</p>
            </div>
            {status !== "loading" && (
              <button onClick={resetAndClose} className="ml-auto text-dex-text-muted hover:text-dex-text transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="p-5">
            {status === "loading" ? (
              <div className="text-center py-6">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_2s_ease-in-out_infinite]" style={{ animationDirection: "alternate" }}>
                    <circle cx="50" cy="50" r="45" fill="#EF4444" stroke="#333" strokeWidth="4"/>
                    <rect x="0" y="47" width="100" height="6" fill="#333"/>
                    <circle cx="50" cy="50" r="45" fill="white" stroke="none" style={{ clipPath: "inset(50% 0 0 0)" }}/>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="4"/>
                    <circle cx="50" cy="50" r="14" fill="white" stroke="#333" strokeWidth="4"/>
                    <circle cx="50" cy="50" r="7" fill="white" stroke="#333" strokeWidth="3"/>
                  </svg>
                  <style>{`
                    @keyframes pokeball-wobble {
                      0%, 100% { transform: rotate(0deg) scale(1); }
                      20% { transform: rotate(-25deg) scale(1.05); }
                      40% { transform: rotate(25deg) scale(1.05); }
                      60% { transform: rotate(-15deg) scale(1.02); }
                      80% { transform: rotate(10deg) scale(1); }
                    }
                  `}</style>
                  <div className="absolute inset-0" style={{ animation: "pokeball-wobble 1.5s ease-in-out infinite" }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="45" fill="#EF4444" stroke="#333" strokeWidth="4"/>
                      <rect x="0" y="47" width="100" height="6" fill="#333"/>
                      <circle cx="50" cy="50" r="45" fill="white" stroke="none" style={{ clipPath: "inset(50% 0 0 0)" }}/>
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="4"/>
                      <circle cx="50" cy="50" r="14" fill="white" stroke="#333" strokeWidth="4"/>
                      <circle cx="50" cy="50" r="7" fill="white" stroke="#333" strokeWidth="3"/>
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-syne font-bold text-dex-text mb-1">
                  {catchMessages[catchStep]}
                </p>
                <div className="flex justify-center gap-1 mt-2">
                  {catchMessages.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        i <= catchStep ? "bg-dex-accent" : "bg-dex-border"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-dex-text-muted mt-3 font-mono">
                  Please wait, catching in progress...
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-dex-text-muted mb-4 leading-relaxed">
                  Paste a LinkedIn profile URL to catch someone and add them to your Pokedex.
                </p>
                <form onSubmit={handleSubmit}>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/..."
                    className="w-full px-4 py-2.5 bg-dex-elevated border border-dex-border/40 rounded-lg text-sm text-dex-text placeholder-dex-text-muted focus:outline-none focus:border-dex-accent/40 focus:shadow-[0_0_0_3px_rgba(138,54,255,0.08)] transition-all disabled:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={!url.trim()}
                    className="w-full mt-3 text-white text-sm font-medium px-4 py-2.5 rounded-lg active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 coveo-gradient-btn"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 100 100" fill="currentColor">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"/>
                      <path d="M5 50 H95" stroke="currentColor" strokeWidth="8"/>
                      <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="8"/>
                    </svg>
                    <span>Throw Pokeball!</span>
                  </button>
                </form>
                {status === "error" && (
                  <p className="text-xs text-red-400 mt-3 text-center">{message}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
