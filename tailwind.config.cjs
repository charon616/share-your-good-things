/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
        bellota: ['Bellota', 'cursive'],
      },
      colors: {
        surface: '#F6F5EC',
        'surface-variant': '#EEE8D6',
        'surface-dark': '#DED5BA', 
        'accent-yellow': '#F4DD6A',
        'accent-purple': '#D7AFFF',
        'accent-green': '#69D2C2',
        primary: '#288FFF',
        'primary-dark': '#007AFF',
        'text-main': '#1A1A1A',
        'text-variant': '#718096',
      },
    },
  },
  plugins: [],
};


