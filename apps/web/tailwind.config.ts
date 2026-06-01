import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1437',
          elevated: '#1A2447',
          deeper: '#060B22',
        },
        ice: '#CADCFC',
        cyan: {
          DEFAULT: '#5EEAD4',
          dim: '#2DD4BF',
        },
        surface: {
          text: '#E2E8F0',
          muted: '#94A3B8',
        },
        success: '#34D399',
        danger: '#F87171',
        warning: '#FBBF24',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(94, 234, 212, 0.15)',
        card: '0 4px 24px rgba(0, 0, 0, 0.35)',
      },
      animation: {
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
        slideDown: 'slideDown 0.4s ease-out',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
