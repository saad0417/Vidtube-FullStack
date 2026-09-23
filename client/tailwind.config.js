/** @type {import('tailwindcss').Config} */

// Every neutral is driven by a CSS variable defined in src/index.css, so the
// whole UI re-themes from one `data-theme` attribute on <html> without any
// component needing light-mode variants. `<alpha-value>` keeps Tailwind's
// opacity modifiers (bg-black/70, text-white/50, ...) working.
const themed = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      screens: {
        xs: '475px',
      },
      colors: {
        // Foreground / background extremes. They swap between themes, so
        // `text-white` always means "strongest text" and `bg-black` always
        // means "deepest surface".
        white: themed('--c-white'),
        black: themed('--c-black'),

        // Higher number = more muted, in both themes.
        gray: {
          50:  themed('--c-gray-50'),
          100: themed('--c-gray-100'),
          200: themed('--c-gray-200'),
          300: themed('--c-gray-300'),
          400: themed('--c-gray-400'),
          500: themed('--c-gray-500'),
          600: themed('--c-gray-600'),
          700: themed('--c-gray-700'),
          800: themed('--c-gray-800'),
          900: themed('--c-gray-900'),
        },

        // Fixed foreground for content on coloured fills — never themed.
        'on-accent': themed('--c-on-accent'),

        brand: {
          DEFAULT: themed('--c-brand'),
          hover:   themed('--c-brand-hover'),
          light:   themed('--c-brand-light'),
          muted:   'rgb(var(--c-brand) / 0.15)',
        },

        // Surface scale. The `dark-` prefix is historical — these are the
        // app's surfaces in whichever theme is active.
        dark: {
          base:    themed('--c-base'),
          surface: themed('--c-surface'),
          card:    themed('--c-card'),
          hover:   themed('--c-hover'),
          border:  themed('--c-border'),
          input:   themed('--c-input'),
          muted:   themed('--c-muted'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'],
        // Display face for headings and the wordmark.
        display: ['Epic Pro', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
