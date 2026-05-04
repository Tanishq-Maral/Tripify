import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sora: ['"Sora"', 'sans-serif'],
        manrope: ['"Manrope"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config