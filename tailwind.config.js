/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6',
        'primary-hover': '#7C3AED',
      },
    },
  },
  plugins: [],
}