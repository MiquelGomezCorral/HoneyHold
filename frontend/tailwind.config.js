/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'paper-blue': '#f2f7fb',
        'paper-blue-raise': '#fafcfe',
        'paper-green': '#f3fbf2',
        'paper-yellow': '#fbfbf2',
        'paper-red': '#fbf2f2',
        ink: '#16324a',
        muted: '#5e7e99',
        hairline: '#d3e2ee',
        accent: '#1f6fae',
        'accent-deep': '#185a8e',
        'accent-soft': '#dbeaf6',
        neg: '#a04b3c',
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};
