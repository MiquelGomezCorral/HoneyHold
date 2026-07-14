/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'paper-blue': 'rgb(var(--paper-blue) / <alpha-value>)',
        'paper-blue-raise': 'rgb(var(--paper-blue-raise) / <alpha-value>)',
        'paper-green': 'rgb(var(--paper-green) / <alpha-value>)',
        'paper-yellow': 'rgb(var(--paper-yellow) / <alpha-value>)',
        'paper-red': 'rgb(var(--paper-red) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-deep': 'rgb(var(--accent-deep) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        neg: 'rgb(var(--neg) / <alpha-value>)',
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};
