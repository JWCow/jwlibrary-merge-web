import JSZip from 'jszip';
import type { JWLibraryManifest } from './types';

export async function sha256(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface UnpackedBackup {
  manifest: JWLibraryManifest;
  userDataDbBytes: Uint8Array;
  extraFiles: Map<string, Uint8Array>;
}

export async function unpackJWLibrary(fileOrBuffer: File | ArrayBuffer | Uint8Array): Promise<UnpackedBackup> {
  const zip = await JSZip.loadAsync(fileOrBuffer);
  
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Invalid .jwlibrary file: missing manifest.json');
  }
  
  const manifestStr = await manifestFile.async('string');
  let manifest: JWLibraryManifest;
  try {
    manifest = JSON.parse(manifestStr);
  } catch (err) {
    throw new Error('Failed to parse manifest.json: invalid JSON');
  }

  const dbFileName = manifest.userDataBackup?.databaseName || 'userData.db';
  const dbFile = zip.file(dbFileName) || zip.file('userData.db');
  if (!dbFile) {
    throw new Error(`Invalid .jwlibrary file: missing ${dbFileName}`);
  }

  const userDataDbBytes = await dbFile.async('uint8array');

  const extraFiles = new Map<string, Uint8Array>();
  for (const [filename, fileObj] of Object.entries(zip.files)) {
    if (!fileObj.dir && filename !== 'manifest.json' && filename !== dbFileName && filename !== 'userData.db') {
      const bytes = await fileObj.async('uint8array');
      extraFiles.set(filename, bytes);
    }
  }

  return {
    manifest,
    userDataDbBytes,
    extraFiles
  };
}

export async function repackJWLibrary(
  manifest: JWLibraryManifest,
  userDataDbBytes: Uint8Array,
  extraFiles?: Map<string, Uint8Array>
): Promise<Blob> {
  const zip = new JSZip();

  // CRITICAL JW Library requirement: manifest.json MUST be the FIRST file in the zip archive!
  // Update hash and lastModified in manifest
  const computedHash = await sha256(userDataDbBytes);
  manifest.userDataBackup.hash = computedHash;

  const manifestJsonStr = JSON.stringify(manifest, null, 2);
  zip.file('manifest.json', manifestJsonStr);

  // Add userData.db
  const dbName = manifest.userDataBackup?.databaseName || 'userData.db';
  zip.file(dbName, userDataDbBytes);

  // Add any extra files (e.g. thumbnails, playlist items)
  if (extraFiles) {
    for (const [name, bytes] of extraFiles.entries()) {
      zip.file(name, bytes);
    }
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
}
