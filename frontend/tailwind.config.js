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
        'display': ['Rayuela', 'Impact', 'Arial Narrow', 'sans-serif'],
        'heading': ['Rayuela', 'Distortion', 'serif'],
        'sans': ['"Neue Montreal"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'brand': {
          'parchment': '#E8DCC8',
          'cream': '#F5EFE6',
          'stone': '#D4C5B0',
          'black': '#0D0D0D',
          'cathedral': '#1A1614',
          'gray': {
            'dark': '#252220',
            'medium': '#3E3228',
            'light': '#5C4E3F',
          },
          'blood': '#8B0000',
          'blood-hover': '#A52A2A',
          'gold': '#D4AF37',
          'gold-dark': '#B8941F',
          'border': '#8B7355',
          'border-dark': '#3E3228',
        },
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
      },
    },
  },
  plugins: [],
}