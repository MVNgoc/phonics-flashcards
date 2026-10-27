import type { Config } from 'tailwindcss'

/**
 * Giao diện Editorial (trang báo / tạp chí in), chỉ có nền sáng. Năm dải màu
 * Tailwind mà component đang dùng được định nghĩa lại thành tông giấy – mực nhưng
 * giữ nguyên tên, nên các class `slate-*`, `sky-*`, … ở component không phải đổi:
 * slate = giấy / mực ấm, sky = xanh mực (nhấn phụ), emerald = xanh rêu (đúng),
 * rose = đỏ báo (sai, nút chính), amber = nâu vàng (khó).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Không bao giờ bật class `dark`, nên các biến thể `dark:` cũ trong component bị bỏ qua.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#faf7f0',
          100: '#eee8db',
          200: '#e0d8c7',
          300: '#cbc0ab',
          400: '#756d60',
          500: '#5c554a',
          600: '#48423a',
          700: '#35302a',
          800: '#26221d',
          900: '#1b1916',
          950: '#110f0d',
        },
        sky: {
          50: '#eef2f7',
          100: '#dbe4ee',
          200: '#b5c7db',
          300: '#87a3c2',
          400: '#5a7fa7',
          500: '#2f5d8a',
          600: '#244b72',
          700: '#1d3c5c',
          800: '#172f48',
          900: '#102234',
          950: '#09131e',
        },
        emerald: {
          50: '#f1f5ec',
          100: '#e1ead5',
          200: '#c3d4ad',
          300: '#9fb985',
          400: '#6f9152',
          500: '#4f7337',
          600: '#3f6129',
          700: '#2f4d1f',
          800: '#233a17',
          900: '#182810',
          950: '#0e1809',
        },
        rose: {
          50: '#fbefed',
          100: '#f5dcd8',
          200: '#ebb7af',
          300: '#dc8a7e',
          400: '#c85a4b',
          500: '#b3261e',
          600: '#9c1f18',
          700: '#7f1913',
          800: '#60130e',
          900: '#420d0a',
          950: '#260705',
        },
        amber: {
          50: '#fbf5e6',
          100: '#f4e6c4',
          200: '#e8cf91',
          300: '#d9b25e',
          400: '#c79438',
          500: '#a87a22',
          600: '#8c641b',
          700: '#6f4f16',
          800: '#533b11',
          900: '#38280b',
          950: '#1f1606',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
        display: ['Fraunces', '"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Góc vuông như bản in, kể cả chip và thanh tiến độ.
      borderRadius: {
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        full: '0',
      },
      transitionProperty: {
        flip: 'transform',
      },
    },
  },
  plugins: [],
} satisfies Config
