# Security & Privacy Policy

## 🔒 100% In-Browser & Zero-Telemetry Architecture

The **JW Library Backup Merger** is designed with privacy as its primary pillar:

- **No Remote File Transmission:** When you upload `.jwlibrary` backup archives, the entire unzip, SQLite database merge, and repack operations occur **exclusively in your browser's local WebAssembly memory** using `sql.js` and `JSZip`.
- **Zero Server Storage:** The web application is served as static HTML, CSS, JavaScript, and WASM assets over Cloudflare CDN. There is no backend server, no database, and no API endpoint receiving your backup data.
- **No Analytics / No Tracking:** This tool does not use any tracking pixels, third-party analytics trackers, or telemetry scripts.
- **Offline Capable:** Once loaded in your browser, the tool works completely offline without requiring an active internet connection.

## Reporting a Security Concern

If you discover a potential security or privacy flaw in the client-side merge logic, please open an issue on the [GitHub Repository](https://github.com/JWCow/jwlibrary-merge-web/issues) or submit a pull request.
