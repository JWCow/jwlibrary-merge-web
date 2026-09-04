# Changelog

All notable changes to the **JW Library Backup Merger** web application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Selective Merging & Partial Export ([#10](https://github.com/JWCow/jwlibrary-merge-web/issues/10)):**
  - **Granular Database Pruning Engine (`src/lib/subset.ts`):** Implemented `buildSubsetDb`, `exportSubset`, and `createSubsetBackup` to prune SQLite databases to selected `LocationId`s and annotation types (notes, highlights, bookmarks, study answers).
  - **Highlight Span Integrity:** Preserves full multi-block and multi-verse `BlockRange` spans by `UserMarkGuid` in partial exports.
  - **Clean Orphan Handling:** Automatically cleans unlinked `TagMap` and `Tag` records and nulls out orphaned `Note.UserMarkId` references; finishes with `VACUUM` for minimal output file sizes.
  - **Interactive Selective Export View (`src/components/SelectiveExportView.tsx`):** Added searchable, filterable location tree in Backup Inspector with per-kind toggle switches and single-click export.
  - **Direct Merge Queue Integration:** Allows feeding partial subsets straight into the in-memory merge queue without intermediate file downloads.
  - **Subset Test Suite (`tests/subset-test.mjs`):** Added 5 unit and integration tests covering location scoping, per-kind toggles, empty-selection validation, manifest-first ZIP packing, SHA-256 verification, and merge isolation.
- **Persistent In-Memory Backup State Across Navigation ([#8](https://github.com/JWCow/jwlibrary-merge-web/issues/8)):**
  - **Global In-Memory Backup Store (`src/lib/backupStore.tsx`):** Introduced a root `BackupStoreProvider` React context preserving loaded backups, merge results, and inspection caches across tab transitions (`MERGE` ↔ `INSPECT` ↔ `ABOUT`).
  - **Direct Merged Output Inspection:** Added an **"Inspect Merged Database"** button in `MergeReportModal` to seamlessly transition into the Inspector with the merged database pre-loaded.
  - **Queue Inspection Actions:** Added an inspect icon button on `BackupCard` components to examine any individual queued backup in the Inspector without clearing loaded files.
  - **Multi-File Switcher:** Added a quick backup switcher dropdown in the Inspector when multiple backups are loaded.
- **Byte Size Formatting Utility ([#5](https://github.com/JWCow/jwlibrary-merge-web/issues/5)):**
  - Added robust `formatBytes` utility with boundary handling for 0 B, KB, MB, and fractional values (`tests/format-test.mjs`).

### Fixed
- **Mobile UI & Responsive Layout Polish ([#7](https://github.com/JWCow/jwlibrary-merge-web/issues/7)):**
  - Resolved horizontal viewport overflow and layout shifts across mobile screen widths in `Navbar` and `DropZone`.
  - Prevented content clipping and improved text wrapping in `StudyAnalyticsView`, `LocationExplorerView`, and `SchemaFaqDrawer`.
  - Polished and streamlined landing page copy for better clarity on small devices.
- **MEPS Language Mappings & Bible Category Resolution:**
  - Corrected MEPS language lookup codes in `src/lib/constants.ts` and `src/lib/locations.ts`.
  - Prevented false Bible category matches in legacy backups where document symbols were absent.
  - Added real backup regression tests in `tests/real-backups-test.mjs`.
- **CI Test Suite Resilience:**
  - Updated test runner to skip real backup test fixtures gracefully when proprietary sample `.jwlibrary` files are absent in CI environments.

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

[Unreleased]: https://github.com/JWCow/jwlibrary-merge-web/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/JWCow/jwlibrary-merge-web/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/JWCow/jwlibrary-merge-web/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/JWCow/jwlibrary-merge-web/releases/tag/v1.0.0
