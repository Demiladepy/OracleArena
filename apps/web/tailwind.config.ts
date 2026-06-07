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
        landing: {
          base: 'var(--bg-base)',
          elevated: 'var(--bg-elevated)',
          card: 'var(--bg-card)',
        },
        navy: {
          DEFAULT: '#0a0a0a',
          elevated: '#111111',
          deeper: '#000000',
        },
        accent: {
          bright: 'var(--accent-bright)',
        },
        purple: {
          accent: 'var(--purple-accent)',
          dim: 'var(--purple-dim)',
        },
        ice: '#d4d4d4',
        cyan: {
          DEFAULT: '#ffffff',
          dim: '#a3a3a3',
        },
        surface: {
          text: '#f2f2f2',
          muted: '#a3a3a3',
        },
        success: '#ffffff',
        danger: '#ef4444',
        warning: '#fbbf24',
      },
      fontFamily: {
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(255, 255, 255, 0.08)',
        card: '0 0 0 1px rgba(255, 255, 255, 0.08)',
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
