/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#8b5cf6',
          purple2: '#a855f7',
          pink: '#ec4899',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
      },
    },
  },
  plugins: [],
};
