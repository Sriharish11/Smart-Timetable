import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1e3a8a",
          light: "#25439c",
          dark: "#172a63",
        },
        royal: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
          light: "#3b82f6",
        },
        canvas: "#f8fafc",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)",
        panel: "0 4px 20px rgba(15,23,42,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
