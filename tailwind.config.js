/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#111318',
        panel: '#181B22',
        paper: '#1F232B',
        line: '#2E3340',
        ink: '#E7E4DC',
        mute: '#8F929B',
        onaccent: '#0D1117',
        steel: { DEFAULT: '#4E97C4', dark: '#3B7EA8' },
        safety: { DEFAULT: '#F0821E', dark: '#CE6C10' },
        rust: '#E2645A',
        moss: '#67B26F',
      },
      fontFamily: {
        head: ['Oswald', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        num: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
