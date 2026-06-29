/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Tokens da marca Ticketfull (placeholder — refinar na próxima etapa)
        brand: {
          DEFAULT: '#6d28d9',
          dark: '#4c1d95',
          light: '#a78bfa',
        },
      },
    },
  },
  plugins: [],
};
