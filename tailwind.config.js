/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': {
          DEFAULT: '#E5703A',
          50: '#FBF4F0',
          100: '#F6E8E0',
          200: '#ECCCC1',
          300: '#E2B1A3',
          400: '#D89584',
          500: '#E5703A',
          600: '#D15A1F',
          700: '#A54419',
          800: '#7A3413',
          900: '#4F230D',
        },
      },
      animation: {
        'gentle-bounce': 'gentle-bounce 2s ease-in-out infinite',
        'pulse-rings': 'pulse-rings 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'gentle-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'pulse-rings': {
          '0%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
          '100%': { 
            transform: 'scale(2)',
            opacity: '0'
          },
        },
      },
    },
  },
  plugins: [],
} 