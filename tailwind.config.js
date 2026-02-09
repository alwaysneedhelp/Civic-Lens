export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          500: '#3b82f6',
          400: '#60a5fa',
        }
      }
    }
  },
  plugins: [],
}
