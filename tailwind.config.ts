import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0C0C0F',
        surface: '#111820',
        card: 'rgba(255,255,255,0.03)',
        cardBorder: 'rgba(255,255,255,0.08)',
        greenDeep: '#1A4A3A',
        greenMid: '#2D6A5A',
        greenBright: '#3D8A6A',
        greenGlow: '#5DAA8A',
        greenText: '#8BA89A',
        greenLight: '#A8C8B8',
        greenPale: '#C8E6D8',
        gold: '#C8A86A',
        textPrimary: '#A8C8B8',
        textSecondary: '#6B8B7B',
        textMuted: '#4A6A5A',
        textDim: '#3A5A4A'
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        devanagari: ['"Tiro Devanagari Hindi"', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;
