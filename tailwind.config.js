/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",             // Scans all HTML files in the main MCS folder
    "./src/**/*.{html,js}"  // Scans all HTML/JS files inside the src folder
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        sci: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          500: '#0ea5e9',
          600: '#0284c7',
          800: '#075985',
          900: '#0c4a6e',
        }
      }
    },
  },
  plugins: [],
}