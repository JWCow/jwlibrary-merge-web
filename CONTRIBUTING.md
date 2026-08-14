# Contributing to JW Library Backup Merger

Thank you for your interest in improving the JW Library Backup Merger!

## Development Guidelines

1. **Keep it 100% Client-Side:** Any new feature must execute entirely in the browser using WebAssembly / TypeScript without adding server-side dependencies or data transmission.
2. **Preserve Invariants:** Ensure strict adherence to JW Library schema integrity:
   - `manifest.json` must always be the first file entry in exported `.jwlibrary` ZIP archives.
   - `manifest.userDataBackup.hash` must match the SHA-256 hex string of `userData.db`.
   - Multi-paragraph highlight `BlockRange` spans must be fully preserved.
3. **Type Safety:** All code must pass `npm run build` (`tsc && vite build`) with zero TypeScript errors or unused variables.

## Local Setup

```bash
git clone https://github.com/JWCow/jwlibrary-merge-web.git
cd jwlibrary-merge-web
npm install
npm run dev
```

## Pull Requests

1. Fork the repo and create a feature branch (`git checkout -b feature/my-enhancement`).
2. Verify local builds pass: `npm run build`.
3. Commit with concise conventional commit messages (`feat: ...`, `fix: ...`).
4. Submit a Pull Request describing your changes.
