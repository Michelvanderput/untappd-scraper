/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['Distortion', 'serif'],
        'sans': ['"Neue Montreal"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}