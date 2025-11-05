/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./src/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'cascadia': ['"Cascadia Code"', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
