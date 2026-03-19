# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

## Architecture

Next.js 16 app using the App Router with React 19 and Tailwind CSS v4.

- `src/app/` — App Router pages and layouts
- `src/app/layout.js` — Root layout (fonts, metadata)
- `src/app/page.js` — Home page
- `src/app/globals.css` — Global styles and CSS variables (Tailwind v4 + dark mode)

Import alias `@/*` maps to `./src/*`.

Tailwind CSS v4 is configured via PostCSS (`postcss.config.mjs`), not a `tailwind.config.js` file.
