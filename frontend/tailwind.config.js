/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#e94560',
        surface: '#1a1a2e',
        panel: '#16213e',
        border: '#2a2a4a',
      },
    },
  },
  plugins: [],
}