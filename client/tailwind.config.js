/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        ghost: {
          50: '#fff5f2',
          100: '#ffe5dd',
          200: '#ffccbe',
          300: '#ffa48d',
          400: '#ff704d',
          500: '#FF4500', // Reddit Orange-Red
          600: '#e03d00',
          700: '#b83200',
          800: '#942800',
          900: '#7a2200',
          950: '#471100',
        },
        cyber: {
          bg: '#030303', // Reddit Dark mode background
          card: '#1A1A1B', // Reddit Dark mode card
          border: '#343536', // Reddit Dark mode border
          glow: '#FF4500',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'glow-strong': '0 2px 5px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
