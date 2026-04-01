/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#944a00',           // Naranja del nuevo diseño
        'primary-container': '#fb923c',
        secondary: '#006d2f',
        background: '#fcf9f8',
        surface: '#fcf9f8',
        'on-surface': '#1b1c1c',
        'surface-container': '#f0eded',
        'surface-container-low': '#f6f3f2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}