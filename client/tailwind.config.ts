/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        zinc: {
          950: '#050505',
          925: '#0a0a0a',
          900: '#09090b',
          850: '#121214',
          800: '#1a1a1e',
          750: '#222226',
          700: '#27272a',
        },
        accent: {
          gold: '#C0A36E',
          'gold-light': '#E5C07B',
          'gold-dark': '#9A7D4E',
        },
        frames: {
          base: '#000000',
          bg: '#050505',
          surface: '#09090b',
          'surface-raised': '#18181b',
          elevated: '#18181b',
          border: '#27272a',
          'border-subtle': '#1a1a1e',
          text: '#ffffff',
          'text-muted': '#a1a1aa',
          'text-subtle': '#71717a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'cinematic': '0 0 40px -10px rgba(255, 255, 255, 0.05)',
        'cinematic-lg': '0 0 60px -15px rgba(255, 255, 255, 0.08)',
        'cinematic-hover': '0 0 40px -5px rgba(255, 255, 255, 0.1)',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'cinematic': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
