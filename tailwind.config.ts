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
        "dex-text": "#282829",
        "dex-text-secondary": "#626971",
        "dex-text-muted": "#b9bdc7",
        "dex-accent": "#8a36ff",
        "dex-accent-hover": "#7928e6",
        "dex-turquoise": "#1cebcf",
        "dex-cerulean": "#00adff",
        "dex-governor": "#2e45ba",
      },
    },
  },
  plugins: [],
};
export default config;
