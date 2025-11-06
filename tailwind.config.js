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
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'display': ['Space Grotesk', 'Poppins', 'Inter', 'sans-serif'],
      },
      colors: {
        // Deceptively calm colors for popup
        calm: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Harsh shame colors for blocked page
        shame: {
          'bg': '#0a0a0a',
          'dark': '#0f0f0f',
          'darker': '#050505',
          'red': {
            DEFAULT: '#dc2626',
            dark: '#b91c1c',
            darker: '#991b1b',
            light: '#f87171',
          },
          'yellow': '#fbbf24',
          'text': '#fafafa',
        },
      },
    },
  },
  plugins: [],
}
