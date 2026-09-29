/** @type {import('tailwindcss').Config} */

// Semantic colour tokens. Values live as RGB triplets in src/index.css
// (light + dark), so every utility supports opacity modifiers like bg-gold/20.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        line: token('line'),
        fg: token('fg'),
        muted: token('muted'),
        gold: token('gold'),
        'on-gold': token('on-gold'),
        ember: token('ember'),
        hop: token('hop'),
        foam: '#F6EEDF',
        stout: '#0E0B09',
      },
      fontFamily: {
        display: ['Migra', 'Georgia', 'serif'],
        heading: ['Migra', 'Georgia', 'serif'],
        sans: ['"Neue Montreal"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        rise: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '10%': { opacity: '0.7' },
          '100%': { transform: 'translateY(-110vh) scale(1.3)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        rise: 'rise linear infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
      },
    },
  },
  plugins: [],
}
