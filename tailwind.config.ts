import type { Config } from 'tailwindcss'

/**
 * Giao diện Cyberpunk, chỉ có nền tối. Năm dải màu Tailwind mà component đang
 * dùng được định nghĩa lại thành bảng màu neon nhưng giữ nguyên tên, nên các
 * class `slate-*`, `sky-*`, … ở component không phải đổi:
 * slate = nền / chữ ánh tím, sky = cyan neon, emerald = xanh acid (đúng),
 * rose = magenta (sai), amber = vàng (khó).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#eef1ff',
          100: '#dfe4fb',
          200: '#bcc4e6',
          300: '#97a1cc',
          400: '#8590c0',
          500: '#646f9e',
          600: '#3b4272',
          700: '#272c52',
          800: '#171b36',
          900: '#0e1024',
          950: '#07080f',
        },
        sky: {
          50: '#e6feff',
          100: '#b8fbff',
          200: '#8af8ff',
          300: '#5cf5ff',
          400: '#2ef2ff',
          500: '#00f0ff',
          600: '#00d8e6',
          700: '#00a9b4',
          800: '#006b73',
          900: '#003c40',
          950: '#00191b',
        },
        emerald: {
          50: '#effff0',
          100: '#d4ffd0',
          200: '#a8ff9a',
          300: '#7dff5c',
          400: '#5bff35',
          500: '#39ff14',
          600: '#39ff14',
          700: '#5bff35',
          800: '#145c0a',
          900: '#0b3d06',
          950: '#06210a',
        },
        rose: {
          50: '#fff0f5',
          100: '#ffd6e4',
          200: '#ffadc8',
          300: '#ff85ab',
          400: '#ff5c8f',
          500: '#ff2a6d',
          600: '#ff2a6d',
          700: '#ff5c8f',
          800: '#7a0f33',
          900: '#4a0920',
          950: '#2a0514',
        },
        amber: {
          50: '#fffde0',
          100: '#fffab3',
          200: '#fff680',
          300: '#fff35c',
          400: '#fef02e',
          500: '#fcee0a',
          600: '#fcee0a',
          700: '#fef02e',
          800: '#6b6500',
          900: '#3d3a00',
          950: '#1f1d00',
        },
      },
      fontFamily: {
        sans: ['"Chakra Petch"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Góc vuông vức kiểu HUD thay cho bo tròn.
      borderRadius: {
        DEFAULT: '2px',
        md: '2px',
        lg: '2px',
        xl: '3px',
        '2xl': '4px',
        full: '2px',
      },
      transitionProperty: {
        flip: 'transform',
      },
    },
  },
  plugins: [],
} satisfies Config
