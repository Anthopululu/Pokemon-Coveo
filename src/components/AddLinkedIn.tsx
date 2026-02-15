"use client";

import { useState, useRef, useEffect } from "react";


export default function AddLinkedIn() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        resetAndClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const linkedinUrl = url.trim();
    if (!linkedinUrl) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/linkedin/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkedinUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Profile added successfully!");
        
        setUrl("");
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
    }, 300);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Button in header */}
      <button
        onClick={() => (isOpen ? resetAndClose() : setIsOpen(true))}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 text-white shadow-md"
        style={{ background: "#0A66C2", boxShadow: "0 2px 8px rgba(10,102,194,0.3)" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Pokemon
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[360px] bg-dex-surface rounded-xl border border-dex-border/80 flex flex-col z-50 overflow-hidden shadow-2xl shadow-black/10 animate-slide-up">
          {/* Header */}
          <div className="px-5 py-4 border-b border-dex-border/50 flex items-center gap-3 bg-dex-bg">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#0A66C2" }}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-syne font-bold text-dex-text">Add to Pokedex</h3>
              <p className="text-[10px] font-mono text-dex-text-muted">From LinkedIn</p>
            </div>
            <button onClick={resetAndClose} className="ml-auto text-dex-text-muted hover:text-dex-text transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            {status === "success" ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-dex-text font-medium">{message}</p>
                <p className="text-[11px] text-dex-text-muted mt-2 font-mono">Search in ~15s to find the profile</p>
                <button
                  onClick={() => { setStatus("idle"); setMessage(""); }}
                  className="mt-3 block mx-auto text-xs font-mono text-dex-accent hover:underline"
                >
                  Add another
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-dex-text-muted mb-4 leading-relaxed">
                  Paste a LinkedIn profile URL to add someone to the Pokedex. Their profile will appear as a searchable card.
                </p>
                <form onSubmit={handleSubmit}>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/..."
                    disabled={status === "loading"}
                    className="w-full px-4 py-2.5 bg-dex-elevated border border-dex-border/40 rounded-lg text-sm text-dex-text placeholder-dex-text-muted focus:outline-none focus:border-[#0A66C2]/40 transition-all disabled:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading" || !url.trim()}
                    className="w-full mt-3 text-white text-sm font-medium px-4 py-2.5 rounded-lg active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: "#0A66C2" }}
                  >
                    {status === "loading" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Scraping profile...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add to Pokedex</span>
                      </>
                    )}
                  </button>
                </form>
                {status === "loading" && (
                  <p className="text-[11px] text-dex-text-muted mt-3 text-center font-mono">
                    This can take up to 60 seconds...
                  </p>
                )}
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
