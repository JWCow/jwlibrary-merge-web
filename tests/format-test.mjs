import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Formats a number of bytes into a human-readable string.
 * @param {number} bytes
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

test('formatBytes helper functionality', async (t) => {
  await t.test('formats 0 bytes correctly', () => {
    assert.equal(formatBytes(0), '0 B');
  });

  await t.test('formats KB values correctly', () => {
    assert.equal(formatBytes(1024), '1 KB');
    assert.equal(formatBytes(2048), '2 KB');
  });

  await t.test('formats MB values correctly', () => {
    assert.equal(formatBytes(1048576), '1 MB');
    assert.equal(formatBytes(5242880), '5 MB');
  });

  await t.test('formats fractional values correctly', () => {
    assert.equal(formatBytes(1536), '1.5 KB');
  });
});
