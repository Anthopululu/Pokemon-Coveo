import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        outfit: ["var(--font-outfit)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        "dex-bg": "#faf9fc",
        "dex-surface": "#ffffff",
        "dex-elevated": "#f3f1f6",
        "dex-border": "#e2dfe8",
        "dex-text": "#1a1a1a",
        "dex-text-secondary": "#555555",
        "dex-text-muted": "#999999",
        "dex-accent": "#8a36ff",
        "dex-accent-hover": "#7928e6",
      },
    },
  },
  plugins: [],
};
export default config;
