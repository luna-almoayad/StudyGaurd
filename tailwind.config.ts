import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#FAF8F3',
          100: '#F5F1EB',
          200: '#E8E0D5',
          300: '#D4C9B8',
        },
        lavender: {
          50: '#F5F3FF',
          100: '#E6E6FA',
          200: '#D8BFD8',
          300: '#B19CD9',
          400: '#9B87C4',
          500: '#8B7FA8',
        },
        sage: {
          50: '#F0F4F0',
          100: '#E0E8E0',
          200: '#C4D4C4',
        },
        focus: {
          green: '#A8D5BA',
          yellow: '#F4D19B',
          red: '#E8B4B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
export default config

