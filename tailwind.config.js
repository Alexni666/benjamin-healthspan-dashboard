/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { 900: '#0a0a0a', 800: '#1a1a1a', 700: '#2a2a2a', 600: '#3a3a3a' },
        gold: { 400: '#c9a96e', 500: '#b8944d', 600: '#a07d3a' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
