import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          bg: "#0a0a0f",
          gold: "#d4a853",
          "gold-light": "#f0d78c",
          card: "#1a1a2e",
          accent: "#e8c56d",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
