// tailwind.config.js
import colors from 'tailwindcss/colors'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.blue,
        secondary: colors.red,
      },
      container: {
        padding: {
          DEFAULT: '2rem',
          sm: '2rem',
          md: '4rem',
          lg: '6rem',
          xl: '8rem',
        },
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
}
