import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      transitionProperty: {
        flip: 'transform',
      },
    },
  },
  plugins: [],
} satisfies Config
