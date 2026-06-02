import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#0C0C0F',
        surface: '#111820',
        card: 'rgba(255,255,255,0.06)',
        cardBorder: 'rgba(255,255,255,0.14)',
        greenDeep: '#1A4A3A',
        greenMid: '#2D6A5A',
        greenBright: '#4AAF85',
        greenGlow: '#6DC9A4',
        greenText: '#9EC4B0',
        greenLight: '#BCD8C8',
        greenPale: '#D4EDE0',
        gold: '#C8A86A',
        textPrimary: '#D4EBE0',
        textSecondary: '#8FBBA8',
        textMuted: '#5E8B79',
        textDim: '#4A7060'
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
