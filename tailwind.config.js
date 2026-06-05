/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'coke-red': '#F40009',
        'coke-black': '#1B1B1B',
        cream: '#F1E9DA',
        caramel: '#A06A00',
        'off-white': '#FFFEF6',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
