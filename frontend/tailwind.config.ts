import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#0a0b0e',
        surface:  '#111318',
        surface2: '#191c23',
        surface3: '#21252f',
        border:   '#252932',
        border2:  '#2e3340',
        accent:   '#f5a623',
        accent2:  '#ff6b35',
        success:  '#2dd98f',
        danger:   '#ff4d4d',
        info:     '#4da6ff',
        purple:   '#a78bfa',
        text:     '#e8eaf0',
        text2:    '#8b92a8',
        text3:    '#555f72',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        lg: '14px',
      },
    },
  },
  plugins: [],
};

export default config;
