# JW Library Backup Merger Web App

A 100% in-browser, privacy-first web application to merge multiple JW Library `.jwlibrary` backup files together without uploading any user data to external servers.

## Tech Stack
- **Framework:** React 18 + React Router + Vite 5 + TypeScript
- **Styling:** Tailwind CSS (Theocratic palette + Dark/Light mode)
- **Database Engine:** `sql.js` (WebAssembly SQLite compiled engine)
- **Archive Engine:** `jszip` (pure JS ZIP handling)
- **Deployment:** Cloudflare Pages (static HTML/JS/WASM output in `dist/`)

## Key Architecture & Guarantees
1. **Zero Server Uploads / 100% Client-Side:** All database unpacking, SQLite querying, merging, and repacking executes within the browser's WebAssembly sandbox.
2. **Multi-Block Highlight Healing:** Avoids legacy JWLMerge truncation bugs by retaining all `BlockRange` spans spanning multiple paragraphs or Bible verses for every `UserMarkGuid`.
3. **Deterministic Conflict Resolution:** Notes are merged by GUID; if modified simultaneously, last-modified timestamp wins.
4. **Valid Manifest SHA-256:** Recalculates exact SHA-256 hash of `userData.db` and guarantees `manifest.json` is the first ZIP entry, satisfying JW Library's strict import validation.

## Commands
```bash
npm run dev        # Start local dev server (port 5173)
npm run build      # Typecheck & build production bundle into dist/
npm run preview    # Preview production build locally
```

## Cloudflare Pages Deployment
```bash
npx wrangler pages deploy dist
```
