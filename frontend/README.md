# Prelegal Frontend

Prototype Mutual NDA creator for [PL-3](https://sagarhoodaph234.atlassian.net/browse/PL-3).

A single-page Next.js app where a user fills in a short form and sees the
completed Mutual NDA update live alongside. The completed document can be
downloaded as a markdown file.

The legal content comes from the curated Common Paper Mutual NDA standard
terms added in PL-2 (`../templates/mutual-nda.md`), so any future edits to
the template propagate automatically.

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Build

```bash
npm run build && npm start
```

Both `dev` and `build` must be run from this `frontend/` directory — the
server-side template loader resolves `../templates/mutual-nda.md` relative
to the process working directory.

## Stack

- Next.js 14 App Router (TypeScript)
- Tailwind CSS + `@tailwindcss/typography` for the document preview
- `react-markdown` + `remark-gfm` to render the completed NDA
