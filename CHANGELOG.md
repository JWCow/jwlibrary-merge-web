# Changelog

All notable changes to the **JW Library Backup Merger** web application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
