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
        "dex-bg": "#faf9f7",
        "dex-surface": "#ffffff",
        "dex-elevated": "#f3f2ef",
        "dex-border": "#e5e2dc",
        "dex-text": "#1a1a1a",
        "dex-text-secondary": "#555555",
        "dex-text-muted": "#999999",
        "dex-accent": "#f97316",
        "dex-accent-hover": "#ea580c",
      },
    },
  },
  plugins: [],
};
export default config;
