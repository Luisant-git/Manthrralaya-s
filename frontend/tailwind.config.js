/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#edd8ff',
          200: '#d9b3ff',
          300: '#c48eff',
          400: '#b069ff',
          500: '#9b44ff',
          600: '#8023e6',
          700: '#6510c4',
          800: '#4d089e',
          900: '#340375',
        }
      }
    },
  },
  plugins: [],
}

