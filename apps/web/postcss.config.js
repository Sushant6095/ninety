// PostCSS — runs the Tailwind v3 plugin so @tailwind directives in styles/globals.css compile to utilities.
// CJS form for robust discovery under the pnpm monorepo. autoprefixer omitted (not installed; optional here).
module.exports = {
  plugins: {
    tailwindcss: {},
  },
};
