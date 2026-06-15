/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ocean: {
          50: "#F0F7FA",
          100: "#D6ECF3",
          200: "#A9D5E6",
          300: "#7CBED9",
          400: "#4FA7CC",
          500: "#088395",
          600: "#0A4D68",
          700: "#073A50",
          800: "#052738",
          900: "#021420",
        },
        aqua: {
          400: "#05BFDB",
          500: "#04A8C2",
        },
        alert: {
          warning: "#FF6B35",
          danger: "#E63946",
          success: "#22C55E",
        },
        ink: {
          900: "#1A1A2E",
          800: "#2D2E3A",
          700: "#3F404A",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 4px 24px -8px rgba(10, 77, 104, 0.12)",
        "card-hover": "0 8px 32px -8px rgba(10, 77, 104, 0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
