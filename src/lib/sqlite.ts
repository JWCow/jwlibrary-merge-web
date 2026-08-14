import initSqlJs, { type SqlJsStatic } from 'sql.js';

let sqlPromise: Promise<SqlJsStatic> | null = null;

export async function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      // Browser environment
      if (typeof window !== 'undefined') {
        try {
          return await initSqlJs({
            locateFile: (file) => `/${file}`
          });
        } catch (err) {
          console.warn('Local WASM load failed, using CDN fallback:', err);
          return await initSqlJs({
            locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
          });
        }
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
    })();
  }
  return sqlPromise;
}
