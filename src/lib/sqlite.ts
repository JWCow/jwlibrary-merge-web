import initSqlJs, { type SqlJsStatic } from 'sql.js';

let sqlPromise: Promise<SqlJsStatic> | null = null;

export async function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (file) => {
        // Try local public folder first, or use CDN fallback for seamless Cloudflare Pages support
        if (typeof window !== 'undefined') {
          return `/${file}`;
        }
        return `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`;
      }
    }).catch(async (err) => {
      console.warn('Local WASM load failed, falling back to CDN:', err);
      return initSqlJs({
        locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
      });
    });
  }
  return sqlPromise;
}
