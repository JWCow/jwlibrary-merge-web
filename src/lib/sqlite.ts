import initSqlJs, { type SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let sqlPromise: Promise<SqlJsStatic> | null = null;

export async function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      // Browser environment
      if (typeof window !== 'undefined') {
        // Strategy 1: Fetch local bundled WASM binary
        try {
          const res = await fetch(sqlWasmUrl);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            // Verify magic header: 0x00, 0x61, 0x73, 0x6D (\0asm)
            const header = new Uint8Array(buf.slice(0, 4));
            if (header[0] === 0x00 && header[1] === 0x61 && header[2] === 0x73 && header[3] === 0x6d) {
              return await initSqlJs({ wasmBinary: buf });
            }
          }
        } catch (err) {
          console.warn('Local WASM fetch failed, trying fallback...', err);
        }

        // Strategy 2: Fetch from reliable Cloudflare CDN
        try {
          const cdnRes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm');
          if (cdnRes.ok) {
            const cdnBuf = await cdnRes.arrayBuffer();
            return await initSqlJs({ wasmBinary: cdnBuf });
          }
        } catch (cdnErr) {
          console.warn('CDN WASM fetch failed:', cdnErr);
        }

        // Strategy 3: Standard locateFile
        return await initSqlJs({
          locateFile: () => sqlWasmUrl
        });
      }

      // Node.js environment
      try {
        const nodeFs = await (Function('return import("fs")')());
        const nodePath = await (Function('return import("path")')());
        const wasmPath = nodePath.resolve(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
        if (nodeFs.existsSync(wasmPath)) {
          const wasmBinary = nodeFs.readFileSync(wasmPath);
          return await initSqlJs({
            wasmBinary: new Uint8Array(wasmBinary).buffer as ArrayBuffer
          });
        }
      } catch (e) {
        // fallback
      }

      return await initSqlJs();
    })().catch((err) => {
      sqlPromise = null; // Reset so user can retry without reloading
      throw err;
    });
  }
  return sqlPromise;
}
