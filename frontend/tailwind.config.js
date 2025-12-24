/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['"Right Gothic"', 'sans-serif'],
        'sans': ['Cirka', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}