/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#0f0f0f',
        surface: '#151515',
        black: '#0f0f0f',
        'neo-pink': '#b75d5d',
        'neo-yellow': '#d5bd63',
        'neo-blue': '#6f92c9',
        'neo-green': '#87b86f',
        'neo-red': '#b75d5d',
      },
      boxShadow: {
        neo: 'none',
        'neo-sm': 'none',
        'neo-lg': 'none',
      },
      animation: {
        'slide-up': 'fadeIn 0.12s ease-out forwards',
        'slide-in-right': 'fadeIn 0.12s ease-out forwards',
        marquee: 'none',
        'fade-in': 'fadeIn 0.12s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
