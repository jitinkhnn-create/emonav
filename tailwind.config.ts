import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#0C0C0F',
        bgSecondary: '#13161C',
        bgCard: '#1A1D24',
        bgCardHover: '#1F232B',
        green: '#2D8A5E',
        greenLight: '#3DAA7A',
        greenDim: 'rgba(45,138,94,0.15)',
        coral: '#D85A4A',
        coralDim: 'rgba(216,90,74,0.15)',
        blue: '#3A7BD5',
        blueDim: 'rgba(58,123,213,0.15)',
        amber: '#D4953A',
        amberDim: 'rgba(212,149,58,0.15)',
        textPrimary: '#E8E6E1',
        textSecondary: '#9A978F',
        textMuted: '#5A5850',
        borderSubtle: 'rgba(255,255,255,0.08)',
        borderHover: 'rgba(255,255,255,0.15)',
        recordingRed: '#E24B4A',
        recordingRedDim: 'rgba(226,75,74,0.2)',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-ring': 'pulseRing 1.4s ease-out infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(1.7)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
