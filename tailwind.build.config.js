/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./packages.html",
    "./questionnaire.html",
    "./results.html",
    "./terms.html",
    "./main.js",
    "./island-core.js"
  ],
  safelist: [
    'opacity-20',
    'opacity-0',
    'opacity-100'
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#f68720',
        'brand-teal': '#14b8a6',
        'brand-beige': '#fef4ea',
      },
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
