/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F4F2EB",
        surface: "#FFFFFF",
        forest: "#24584F",
        deepforest: "#183B34",
        sage: "#A8B8A5",
        terracotta: "#C96F53",
        ink: "#20302D",
        secondary: "#68736D",
        line: "#DFE2D8",
        subtle: "#EAEDE5",
      },
      fontFamily: {
        serif: ['"DM Serif Display"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
