# Examination Portal

A modern, fully client-side online quiz portal built with React, Vite, Tailwind CSS, and browser localStorage persistence.

## Features

- separate student/admin sign-in and account creation flows (demo-only, browser-local authentication)
- quiz catalog, search, and category filters
- quiz authoring and editing in admin studio
- localStorage-based quizzes, attempts, profiles, and users
- countdown timer and auto-submission for quiz attempts
- scoring, answer breakdown, and result page
- analytics dashboard with category and grade insights
- JSON quiz import/export
- print-ready branded certificate layout
- responsive routing and polished UI

## Run locally

```bash
cd "C:\Users\acer\Desktop\Examination Portal"
npm install
npm run dev -- --host 0.0.0.0
```
Then open the local Vite URL shown in the terminal, usually:

```text
http://localhost:5173/
```

## Build for production

```bash
npm run build
```

## Storage model

All quiz, user, profile, and attempt data is stored in the browser's localStorage using a dedicated helper layer in `src/storageService.js`.

## Notes

This is a frontend-only app intended for a local demonstration environment and does not use a backend or database.
Admin accounts can be created from the Admin Account tab; this does not provide production-grade role security.

## Project report

See [PROJECT_REPORT.md](./PROJECT_REPORT.md) for the project objectives, architecture, technology stack, learning outcomes, screenshots, and development challenges.
