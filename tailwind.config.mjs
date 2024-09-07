/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "75ch",
          },
        },
        invert: {
          css: {
            "--tw-prose-body": "#cbd5e1",
            "--tw-prose-headings": "#f1f5f9",
            "--tw-prose-links": "#38bdf8",
            "--tw-prose-code": "#e2e8f0",
            "--tw-prose-pre-bg": "#1e293b",
          },
        },
      },
    },
  },
  plugins: [],
};
