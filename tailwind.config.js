/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",             // Scans all HTML files in the main MCS folder
    "./src/**/*.{html,js}"  // Scans all HTML/JS files inside the src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}