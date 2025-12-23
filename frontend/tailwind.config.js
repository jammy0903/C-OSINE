/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background - Charcoal Gray Dark Theme
        bg: {
          DEFAULT: '#1c1c1e',
          elevated: '#2c2c2e',
          tertiary: '#3c3c3e',
          hover: '#3a3a3c',
        },
        // Text colors
        text: {
          DEFAULT: '#ffffff',
          secondary: '#a1a1a6',
          tertiary: '#636366',
          muted: '#48484a',
        },
        // Primary - Indigo/Blue
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          light: '#818cf8',
          muted: 'rgba(99, 102, 241, 0.15)',
        },
        // Success - Green
        success: {
          DEFAULT: '#34d399',
          light: '#6ee7b7',
          dark: '#10b981',
          muted: 'rgba(52, 211, 153, 0.15)',
        },
        // Warning - Orange
        warning: {
          DEFAULT: '#fbbf24',
          light: '#fcd34d',
          dark: '#f59e0b',
          muted: 'rgba(251, 191, 36, 0.15)',
        },
        // Danger - Red
        danger: {
          DEFAULT: '#f87171',
          light: '#fca5a5',
          dark: '#ef4444',
          muted: 'rgba(248, 113, 113, 0.15)',
        },
        // Info - Cyan
        info: {
          DEFAULT: '#22d3ee',
          light: '#67e8f9',
          dark: '#06b6d4',
          muted: 'rgba(34, 211, 238, 0.15)',
        },
        // Border
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          light: 'rgba(255, 255, 255, 0.05)',
          dark: 'rgba(255, 255, 255, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        logo: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
