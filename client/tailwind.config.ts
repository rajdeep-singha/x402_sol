import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'nb-black': '#08060d',
        'nb-white': '#fff',
        'nb-gray': '#f4f3ec',
        'nb-yellow': '#ffd700',
        'nb-cyan': '#00d9ff',
        'nb-lime': '#00ff00',
        'nb-orange': '#ff8c00',
        'nb-red': '#ff0000',
        'nb-pink': '#ff1493',
        'nb-purple': '#a020f0',
      },
      fontFamily: {
        display: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        body: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'nb': '0 4px 0 rgba(0, 0, 0, 1)',
        'nb-sm': '0 2px 0 rgba(0, 0, 0, 1)',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
} satisfies Config;
