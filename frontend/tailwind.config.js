/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        earthy: {
          50: '#f7f6f0',
          100: '#eceadc',
          200: '#dbd5bd',
          300: '#c5b897',
          400: '#b09973',
          500: '#9b7d55',
          600: '#896847',
          700: '#72523b',
          800: '#5e4333',
          900: '#4e382d',
          950: '#2a1d17',
        }
      }
    },
  },
  plugins: [],
}
