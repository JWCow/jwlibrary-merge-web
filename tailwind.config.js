/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theocratic: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3daeb',
          300: '#95bedc',
          400: '#619dc8',
          500: '#3d81b3',
          600: '#2c6796',
          700: '#25537a',
          800: '#224765',
          900: '#203c54',
          950: '#142738',
        }
      }
    },
  },
  plugins: [],
}
