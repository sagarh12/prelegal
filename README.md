# prelegal

> Generate common legal documents from guided templates — and export them to clean, ready-to-use PDFs.

prelegal lets users draft routine legal documents (agreements, notices, letters) by filling in a guided form instead of starting from a blank page, then export the result as a polished PDF.

## Features

- **Template-driven drafting** — pick a document type and fill guided fields (`templates/`)
- **Live preview** — see the formatted document update as you type
- **Markdown rendering** — rich, structured document formatting via `react-markdown` + `remark-gfm`
- **PDF export** — download a print-ready document with `jsPDF` + `html2canvas`

## Tech stack

- **Next.js** (App Router) + React + TypeScript
- **react-markdown / remark-gfm** — document rendering
- **jsPDF / html2canvas** — client-side PDF generation
- Tailwind CSS

## Project structure

```
frontend/   Next.js app (UI, components, lib)
templates/  Document templates
```

## Getting started

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

## Status

🚧 In progress — core drafting and PDF export are functional; additional document templates and polish ongoing.
