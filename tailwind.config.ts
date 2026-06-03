import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          bg: "#06060e",
          "bg-light": "#0d0d1a",
          gold: "#c8943e",
          "gold-dark": "#a07628",
          "gold-light": "#f5d98e",
          card: "#14142a",
          "card-hover": "#1a1a3a",
          accent: "#e2b96f",
          dim: "#2a2a3a",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "scale-in": "scaleIn 0.4s ease-out",
        "bar-grow": "barGrow 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 8s ease-in-out infinite",
        "float-delay": "float 9s ease-in-out 2s infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
        "count-in": "countIn 0.5s ease-out",
        bounce: "softBounce 0.6s ease-out",
        confetti: "confetti 1.5s ease-out forwards",
        spotlight: "spotlight 10s ease-in-out infinite alternate",
        "qr-pulse": "qrPulse 2s ease-in-out infinite",
        "check-draw": "checkDraw 0.4s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        barGrow: {
          "0%": { width: "0%" },
          "100%": { width: "var(--bar-width)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 4px rgba(200,148,62,0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(200,148,62,0.5)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0) rotate(0deg)", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { transform: "translateY(-100vh) translateX(60px) rotate(180deg)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        countIn: {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.9)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        softBounce: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        confetti: {
          "0%": { transform: "translate(0, 0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(var(--x), var(--y)) rotate(var(--r))", opacity: "0" },
        },
        spotlight: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        qrPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(200,148,62,0.4)" },
          "50%": { boxShadow: "0 0 0 20px rgba(200,148,62,0)" },
        },
        checkDraw: {
          "0%": { strokeDashoffset: "50" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
