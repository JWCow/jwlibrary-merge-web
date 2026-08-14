# JW Library Backup Merger Web App 📖⚡

A fast, private, 100% in-browser tool to merge multiple JW Library (`.jwlibrary`) backup files from iPads, iPhones, Android devices, and Windows PCs into a single unified backup.

🌐 **Live URL:** [https://jwlibrary-merge.mastern8n.cc](https://jwlibrary-merge.mastern8n.cc)  
🐙 **GitHub Repository:** [https://github.com/JWCow/jwlibrary-merge-web](https://github.com/JWCow/jwlibrary-merge-web)

---

## ✨ Features

- 🔒 **100% Client-Side Privacy:** Merges SQLite databases directly in browser memory using WebAssembly (`sql.js`). No user notes, highlights, or backup files are ever sent to any remote server.
- ⚡ **Multi-Paragraph Highlight Healing:** Fixes the historical truncation bug found in third-party merger tools by strictly preserving all `BlockRange` rows across multi-paragraph highlights and scripture spans.
- 🎯 **Dynamic Schema Adaptation:** Seamlessly merges across different JW Library database schema versions (e.g. v14/v15 vs v16 `Specialty`, `Edition` columns).
- 🏷️ **Smart Conflict Resolution:** Full additive union for distinct highlights, bookmarks, tags, and input fields. Last-modified wins for note timestamp collisions.
- 📱 **Device Recognition & Badges:** Automatically identifies iPad, iPhone, Android, and Windows PC backups with device-specific badges.
- 🖼️ **Media & Attached Image Preservation:** Retains custom playlist images, notes thumbnails, and `.png`/`.jpg` media assets.
- 🛡️ **Cryptographic Manifest Integrity:** Guarantees `manifest.json` is the first ZIP entry and recalculates exact SHA-256 hashes of `userData.db` for zero-error restoration in JW Library.
- 📲 **PWA & Mobile QR Pairing:** Includes a built-in QR code modal so users can scan from iPad/iPhone camera and use it as an offline Home Screen web app.
- 🔍 **Integrated Backup Explorer:** Inspect database tables, notes, bookmarks, and schema counts before or after merging.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** React 18, React Router v6, TypeScript, Vite 5, Tailwind CSS
- **Database Engine:** WebAssembly SQLite (`sql.js`) with dynamic column introspection (`PRAGMA table_info`)
- **Archive Handler:** `JSZip` (custom manifest-first packager + SHA-256 hasher via Web Crypto API)
- **Icons & UI:** `lucide-react`, glassmorphism dark/light theme
- **Hosting:** Cloudflare Pages / Workers Static Assets (`wrangler.toml` SPA configuration)

---

## 🚀 Development & Local Preview

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm 10+

### Setup

```bash
# Clone repository
git clone https://github.com/JWCow/jwlibrary-merge-web.git
cd jwlibrary-merge-web

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Visit `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🌐 Cloudflare Deployment

The project is pre-configured for Cloudflare Pages and Workers with Static Assets:

- `wrangler.toml`:
  ```toml
  name = "jwlibrary-merge-web"
  compatibility_date = "2024-08-01"

  [assets]
  directory = "./dist"
  not_found_handling = "single-page-application"
  ```
- Build command: `npm run build`
- Output directory: `dist`

---

## 📄 License

MIT License — Created for personal and theocratic study enhancement.
