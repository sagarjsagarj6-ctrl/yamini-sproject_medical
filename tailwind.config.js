/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './client/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Clinical teal — the MEDICO primary ramp
        brand: {
          50: '#eefdf9',
          100: '#d3f8ef',
          200: '#a9efe0',
          300: '#74e0cd',
          400: '#3bc9b6',
          500: '#14ab9a',
          600: '#0a9187',
          700: '#04807a',
          800: '#045f5b',
          900: '#0c4b47',
          950: '#042e2c'
        },
        // Surgical navy — the dark console shell
        console: {
          950: '#05161d',
          900: '#07202a',
          800: '#0b2c39',
          700: '#123c4c',
          600: '#1a5163'
        },
        // Vitals — semantic status colours used across the platform
        vital: {
          stable: '#0f9d6e',
          caution: '#d97706',
          critical: '#e11d48',
          info: '#0284c7',
          ai: '#7c3aed'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif']
      },
      boxShadow: {
        soft: '0 20px 50px rgba(10, 40, 52, .12)',
        clinical: '0 1px 2px rgba(10,40,52,.05), 0 14px 38px rgba(10,40,52,.09)',
        'clinical-lg': '0 2px 4px rgba(10,40,52,.05), 0 30px 70px rgba(10,40,52,.16)',
        console: '0 18px 44px rgba(5, 22, 29, .38)',
        glow: '0 0 0 1px rgba(10,145,135,.28), 0 10px 30px rgba(10,145,135,.24)'
      },
      backgroundImage: {
        'console-panel': 'linear-gradient(180deg, #07202a 0%, #05161d 100%)',
        'brand-gradient': 'linear-gradient(135deg, #0a9187 0%, #045f5b 100%)'
      },
      keyframes: {
        'card-enter': {
          from: { opacity: '0', transform: 'translateY(16px) scale(.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        'route-enter': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'gentle-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-ring': {
          '0%': { transform: 'scale(.75)', opacity: '.45' },
          '70%': { transform: 'scale(1.9)', opacity: '0' },
          '100%': { transform: 'scale(1.9)', opacity: '0' }
        },
        'ecg-draw': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '600px 0' }
        },
        shimmer: {
          '0%': { backgroundPosition: '140% 0' },
          '100%': { backgroundPosition: '-40% 0' }
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.16)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.12)' },
          '60%': { transform: 'scale(1)' }
        }
      },
      animation: {
        'card-enter': 'card-enter 560ms cubic-bezier(.2,.75,.25,1) both',
        'route-enter': 'route-enter 460ms cubic-bezier(.2,.75,.25,1) both',
        'gentle-float': 'gentle-float 7s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.1s cubic-bezier(.24,.8,.4,1) infinite',
        'ecg-draw': 'ecg-draw 3.4s linear infinite',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        heartbeat: 'heartbeat 2.4s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
