/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.html",
    "./**/*.js"
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
