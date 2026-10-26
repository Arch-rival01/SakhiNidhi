/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          700: '#15803d',
          800: '#166534',
          900: '#1B6B4A', // Primary deep green
          950: '#0f3f2b',
        },
        turmeric: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#E8892B', // Turmeric accent
          600: '#d97706',
          700: '#b45309',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FFFDF9',
          200: '#FFF9F0', // Warm cream background
          300: '#F7EFE1',
          400: '#ECE0CE',
        },
        terracotta: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#D94E34', // Terracotta alert
          800: '#991b1b',
        },
        money: {
          in: '#1B6B4A',
          out: '#D94E34',
          pending: '#E8892B',
          info: '#1E40AF',
        }
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans Devanagari', 'system-ui', '-apple-system', 'sans-serif'],
        olchiki: ['Noto Sans Ol Chiki', 'Noto Sans', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'Noto Sans', 'sans-serif'],
      },
      minHeight: {
        'touch': '56px',
      },
      minWidth: {
        'touch': '56px',
      }
    },
  },
  plugins: [],
}
