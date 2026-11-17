/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#24364B',
          50: '#f3f6f9',
          100: '#e3eaf2',
          200: '#c6d4e4',
          300: '#94abc8',
          400: '#5d7da3',
          500: '#3d5c81',
          600: '#2e4761',
          700: '#24364B',
          800: '#1b2939',
          900: '#121d29',
        },
        powder: {
          50: '#f7fafd',
          100: '#DCEAF5',
          200: '#c3dbeb',
          300: '#9fc4e0',
          400: '#7aa9d0',
          500: '#5a8cb8',
        },
        lavender: {
          50: '#f8f6fb',
          100: '#E6E0F0',
          200: '#d2c7e3',
          300: '#b5a3cf',
          400: '#967cb8',
          500: '#7a5f9e',
        },
        peach: {
          50: '#fdf4f0',
          100: '#F6C7B5',
          200: '#f0ac93',
          300: '#e78d6c',
          400: '#dc6f49',
          500: '#c55a36',
        },
        mist: '#F5F6F8',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(36,54,75,0.05), 0 8px 24px -8px rgba(36,54,75,0.12)',
        'card-hover': '0 2px 4px rgba(36,54,75,0.06), 0 16px 40px -12px rgba(36,54,75,0.2)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
