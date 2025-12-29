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
          'cream': '#F6F2EC',
          'white': '#FEFDFB',
          'black': '#0F0F0F',
          'gray': {
            'dark': '#141414',
            'medium': '#3D3D3D',
            'light': '#6B6B6B',
          },
          'accent': '#FF3B1F',
          'accent-hover': '#E6351B',
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