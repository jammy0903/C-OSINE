/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  // 동적 클래스 보장 (태그 색상용) - constants.ts와 동기화 필요
  safelist: [
    // 태그 배경색 + 텍스트색
    'bg-indigo-500/15', 'text-indigo-400',
    'bg-red-400/15', 'text-red-400',
    'bg-amber-400/15', 'text-amber-400',
    'bg-amber-600/15', 'text-amber-600',
    'bg-emerald-400/15', 'text-emerald-400',
    'bg-cyan-400/15', 'text-cyan-400',
    'bg-orange-400/15', 'text-orange-400',
    'bg-pink-400/15', 'text-pink-400',
    'bg-violet-400/15', 'text-violet-400',
    'bg-lime-400/15', 'text-lime-400',
    'bg-teal-400/15', 'text-teal-400',
    'bg-blue-400/15', 'text-blue-400',
    'bg-green-400/15', 'text-green-400',
    'bg-yellow-400/15', 'text-yellow-400',
    'bg-purple-400/15', 'text-purple-400',
    'bg-purple-500/15',
    'bg-rose-400/15', 'text-rose-400',
    'bg-sky-500/15', 'text-sky-400',
    'bg-slate-400/15', 'text-slate-400',
  ],
  theme: {
    extend: {
      colors: {
        // Background - CSS 변수 사용
        bg: {
          DEFAULT: 'var(--color-bg)',
          elevated: 'var(--color-bg-elevated)',
          tertiary: 'var(--color-bg-tertiary)',
          hover: 'var(--color-bg-hover)',
        },
        // Text colors
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
        },
        // Primary
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
          muted: 'var(--color-primary-muted)',
        },
        // Success
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
          dark: 'var(--color-success-dark)',
          muted: 'var(--color-success-muted)',
        },
        // Warning
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
          dark: 'var(--color-warning-dark)',
          muted: 'var(--color-warning-muted)',
        },
        // Danger
        danger: {
          DEFAULT: 'var(--color-danger)',
          light: 'var(--color-danger-light)',
          dark: 'var(--color-danger-dark)',
          muted: 'var(--color-danger-muted)',
        },
        // Info
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
          dark: 'var(--color-info-dark)',
          muted: 'var(--color-info-muted)',
        },
        // Border
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
          dark: 'var(--color-border-dark)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
        logo: ['var(--font-logo)'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px var(--color-primary-muted)',
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
