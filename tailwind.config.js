/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/templates/*.html', './build.mjs'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orange: {
          400: '#ff825c',
          500: '#f36538', // BABU
          600: '#c8431b',
          700: '#b33510',
          950: '#2d0f06'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  }
};
