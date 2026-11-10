/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          lavender: "rgb(var(--pastel-lavender, 217 199 255) / <alpha-value>)",
          purple: "rgb(var(--pastel-purple, 185 160 245) / <alpha-value>)",
          pink: "rgb(var(--pastel-pink, 255 217 232) / <alpha-value>)",
          babypink: "rgb(var(--pastel-babypink, 255 240 246) / <alpha-value>)",
          milky: "rgb(var(--pastel-milky, 255 252 255) / <alpha-value>)",
          deep: "rgb(var(--pastel-deep, 101 80 128) / <alpha-value>)",
          blue: "rgb(var(--pastel-blue, 220 235 255) / <alpha-value>)",
          yellow: "rgb(var(--pastel-yellow, 255 241 184) / <alpha-value>)",
          green: "rgb(var(--pastel-green, 216 245 229) / <alpha-value>)",
        },
      },
      fontFamily: {
        thai: ["'IBM Plex Sans Thai'", "'Noto Sans Thai'", "sans-serif"],
        magic: ["'Cinzel'", "'Playfair Display'", "'IBM Plex Sans Thai'", "serif"],
      },
      animation: {
        'sparkle-slow': 'sparkle 4s ease-in-out infinite',
        'float-slow': 'float 5s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        sparkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.9) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1.1) rotate(15deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
};
