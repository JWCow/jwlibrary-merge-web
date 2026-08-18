# Changelog

All notable changes to the **JW Library Backup Merger** web application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-08-18

### Added
- **Deep Study Overview & Differentiated Analytics Dashboard ([#4](https://github.com/JWCow/jwlibrary-merge-web/issues/4)):**
  - **Multilingual Breakdown:** Grouped personal highlights (`UserMark`), study notes (`Note`), and bookmarks (`Bookmark`) by MEPS Language with visual distribution bars.
  - **The Watchtower Analysis:** Grouped highlights and notes by year and expandable monthly study issues via `IssueTagNumber`.
  - **Bible & Publication Categorization:** Categorized study activity across Holy Scriptures (66 Bible books), Meeting Workbooks (`mwb`), Study Books & Brochures (*Enjoy Life Forever!*), and General/Independent Notes.
  - **Top Studied Publications:** Ranked publications by total annotation density.
- **Location Explorer & Density Inspector:**
  - Dedicated **"Locations"** tab in Backup Explorer listing all Bible chapters, publication documents, and media tracks.
  - Human-friendly title resolution, MEPS language badges, issue tag dates, and attached highlight/note counts.
  - Interactive search and sorting controls (by annotation density, title, or modification date).
  - Explanatory *"What is a Location?"* guide answering how JW Library maps publications and verses.
- **Database Schema & Merge Engine FAQ Drawer:**
  - In-app slide-over FAQ modal explaining `UserMark` vs `BlockRange` (master highlight entity vs text spans).
  - Detailed explanation of Multi-Block Highlight Healing, character vs word token offsets (`StartToken`/`EndToken`), and merge audit log telemetry (`Unified X block range(s) (+Y new/healed)`).
  - Direct deep-links from the Smart Auto-Repair report banner to relevant FAQ sections.
- **Interactive Multi-Language & Publication Filter Controls for Notes & Bookmarks:**
  - Dynamic Language dropdown populated strictly from languages present in the backup, with live item counts.
  - Publication Category dropdown (Bible, Watchtower, Life & Ministry Workbook, Books & Brochures, Independent Notes).
  - Combined multi-predicate text search and real-time counter (`Showing X of Y notes`).
  - 1-click **"Clear Filters"** button, highlight color indicators (1–6), timestamps, expandable previews, and copy-to-clipboard button.
- **Domain Constants & Contextual Tooltips:**
  - Typed lookup dictionaries for MEPS languages, 66 Bible books, and JW publication symbols.
  - Reusable, accessible `InfoTooltip` `(i)` icons rendered across all SQLite table metrics and counter cards.
- **Expanded Automated Test Suite (43 tests):**
  - Added dedicated test suites for domain constants (`tests/constants-test.mjs`), analytics engine (`tests/analytics-test.mjs`), location explorer (`tests/location-test.mjs`), FAQ guide (`tests/faq-test.mjs`), and filter controls (`tests/notes-bookmarks-filters-test.mjs`).

---

## [1.0.1] - 2026-08-17

### Fixed
- **TagMap Position Collision Resolution ([#3](https://github.com/JWCow/jwlibrary-merge-web/issues/3)):** Resolved `UNIQUE constraint failed: TagMap.TagId, TagMap.Position` error when merging backups where both files contained tags starting at index 0. The merge engine now dynamically computes the next sequential `Position` for each tag (`MAX(Position) + 1`).
- **Cross-Schema Compatibility (Schema v1 to v14+):**
  - Made table column insertions and updates dynamic across all database schemas.
  - Fixed Note `Created` timestamp handling: preserved existing creation dates during note updates (`COALESCE(?, Created)`) and safeguarded against missing `Created` columns in older backups (e.g. Schema v1–v4).
  - Fixed silent note extraction failures in the Backup Explorer / Inspector for legacy schemas lacking the `Created` column.
  - Added safe `Bookmark` slot deduplication and `INSERT OR IGNORE` collision protection.
- **Universal SQLite WASM Loading:** Updated SQLite WASM loader to reliably execute in both Vite browser bundle environments and Node.js unit test runners.

### Added
- **Automated Unit Test Suite (`npm test`):** Added 7 comprehensive test scenarios in `tests/merge-test.mjs` covering TagMap position resolution, multi-block highlight healing, timestamp conflict resolution, legacy schema extraction, cross-schema migration, bookmark deduplication, and ZIP manifest integrity.
- **CI Test Step:** Added automated test execution (`npm test`) to GitHub Actions CI workflow (`.github/workflows/ci.yml`).

---

## [1.0.0] - 2026-08-14

### Initial Release
- **100% In-Browser Privacy:** Fully client-side SQLite database unpacking, querying, merging, and repacking via WebAssembly (`sql.js`) with zero server uploads.
- **Multi-Paragraph Highlight Healing:** Reconstructed and preserved all multi-paragraph and multi-verse `BlockRange` spans by `UserMarkGuid`, fixing the highlight truncation bug present in legacy tools.
- **Strict Manifest-First ZIP Packing:** Recalculates exact SHA-256 hash of `userData.db` and ensures `manifest.json` is the first entry in the generated `.jwlibrary` archive.
- **Integrated Backup Explorer & Inspector:** Search notes, inspect bookmarks, view SQLite table record counts, and repair unhashed backups.
- **Modern Responsive UI:** Built with React 18, Vite 5, Tailwind CSS, Dark/Light mode support, and Mobile QR code pairing modal.
