/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        accord: {
          bg: "#0a0e1a",
          card: "#111827",
          border: "#1e293b",
          accent: "#6366f1",
          green: "#10b981",
          yellow: "#f59e0b",
          red: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
