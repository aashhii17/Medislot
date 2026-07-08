/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      colors: {
        warm: {
          50:  '#FFF8F0',
          100: '#FFF0DC',
          200: '#FFD9A8',
          300: '#FFC070',
          400: '#FFA030',
          500: '#E07B0A',
          600: '#C46300',
          700: '#9A4C00',
          800: '#6F3600',
          900: '#4A2300',
        }
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          // Warm amber-based primary
          primary: "#C46300",
          "primary-content": "#FFFFFF",
          secondary: "#E07B0A",
          "secondary-content": "#FFFFFF",
          accent: "#DC2626",
          "accent-content": "#FFFFFF",
          neutral: "#292524",
          "neutral-content": "#FFFFFF",
          // Warm cream backgrounds
          "base-100": "#FFFBF5",
          "base-200": "#FFF5E6",
          "base-300": "#FFE8C8",
          "base-content": "#292524",
          info: "#0EA5E9",
          success: "#16A34A",
          warning: "#F59E0B",
          error: "#DC2626",
        },
        dark: {
          primary: "#F59E0B",
          "primary-content": "#1C1008",
          secondary: "#FBB83E",
          "secondary-content": "#1C1008",
          accent: "#F87171",
          "accent-content": "#1C1008",
          neutral: "#1C1917",
          "neutral-content": "#F5F0EA",
          "base-100": "#1C1917",
          "base-200": "#0C0A09",
          "base-300": "#050403",
          "base-content": "#F5F0EA",
          info: "#38BDF8",
          success: "#4ADE80",
          warning: "#FBBF24",
          error: "#F87171",
        },
      }
    ],
    darkTheme: "dark",
  }
}
