/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4d2c7b',
          light: '#f8f5ff',
          border: '#e4dbf1',
          white: '#ffffff',
          black: '#000000',
        }
      },
      fontFamily: {
        heading: ['Arial', 'sans-serif'],
        sans: ['Open Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
