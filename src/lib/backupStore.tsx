import React, { createContext, useContext, useCallback, useMemo, useRef, useState } from 'react';
import type {
  BackupMetadata,
  BackupAnalytics,
  NoteDetail,
  BookmarkDetail,
  LocationDetail
} from './types';
import type { MergeResult } from './merge';

/**
 * Derived (expensive) inspection data for a single backup, cached by backup id so
 * that navigating between the Merger and the Inspector never re-parses the database.
 */
export interface InspectionData {
  analytics: BackupAnalytics | null;
  notes: NoteDetail[];
  bookmarks: BookmarkDetail[];
  locations: LocationDetail[];
}

interface BackupStoreValue {
  /** Loaded backups. Index 0 is the "base template" used by the merge engine. */
  backups: BackupMetadata[];
  /** The backup currently opened in the Inspector (defaults to the base template). */
  selected: BackupMetadata | null;
  selectedId: string | null;

  /** Append newly dropped files, skipping duplicates (same name + size). */
  addBackups: (incoming: BackupMetadata[]) => BackupMetadata[];
  /** Put a backup at the top of the list (making it the base template) and select it. */
  promoteBackup: (backup: BackupMetadata) => void;
  removeBackup: (id: string) => void;
  clearBackups: () => void;
  reorderBackups: (from: number, to: number) => void;
  selectBackup: (id: string | null) => void;

  getInspection: (id: string) => InspectionData | undefined;
  setInspection: (id: string, data: InspectionData) => void;

  /** Last merge result, kept so leaving and returning to the Merger tab is lossless. */
  mergeResult: MergeResult | null;
  setMergeResult: (result: MergeResult | null) => void;
  mergeLogs: string[];
  setMergeLogs: React.Dispatch<React.SetStateAction<string[]>>;
  outputFileName: string;
  setOutputFileName: (name: string) => void;
}

const BackupStoreContext = createContext<BackupStoreValue | null>(null);

const defaultOutputFileName = () =>
  `jwlibrary-merged-${new Date().toISOString().slice(0, 10)}.jwlibrary`;

const dedupeKey = (b: BackupMetadata) => `${b.fileName}-${b.fileSize}`;

export const BackupStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [mergeLogs, setMergeLogs] = useState<string[]>([]);
  const [outputFileName, setOutputFileName] = useState<string>(defaultOutputFileName);
  const inspectionCache = useRef(new Map<string, InspectionData>());

  // Mirror of `backups` so callbacks can dedupe against the live list synchronously.
  const backupsRef = useRef<BackupMetadata[]>(backups);
  backupsRef.current = backups;

  const addBackups = useCallback((incoming: BackupMetadata[]) => {
    const existing = new Set(backupsRef.current.map(dedupeKey));
    const added = incoming.filter(b => !existing.has(dedupeKey(b)));
    if (added.length > 0) setBackups([...backupsRef.current, ...added]);
    setSelectedId(prev => prev ?? added[0]?.id ?? null);
    return added;
  }, []);

  const promoteBackup = useCallback((backup: BackupMetadata) => {
    setBackups(prev => [backup, ...prev.filter(b => dedupeKey(b) !== dedupeKey(backup))]);
    setSelectedId(backup.id);
  }, []);



  const removeBackup = useCallback((id: string) => {
    inspectionCache.current.delete(id);
    setBackups(prev => {
      const next = prev.filter(b => b.id !== id);
      setSelectedId(cur => (cur === id ? next[0]?.id ?? null : cur));
      return next;
    });
  }, []);

  const clearBackups = useCallback(() => {
    inspectionCache.current.clear();
    setBackups([]);
    setSelectedId(null);
    setMergeResult(null);
    setMergeLogs([]);
  }, []);

  const reorderBackups = useCallback((from: number, to: number) => {
    setBackups(prev => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }, []);

  const getInspection = useCallback((id: string) => inspectionCache.current.get(id), []);
  const setInspection = useCallback((id: string, data: InspectionData) => {
    inspectionCache.current.set(id, data);
  }, []);

  // The Inspector falls back to the base template whenever nothing explicit is selected.
  const selected = useMemo(
    () => backups.find(b => b.id === selectedId) ?? backups[0] ?? null,
    [backups, selectedId]
  );

  const value: BackupStoreValue = {
    backups,
    selected,
    selectedId,
    addBackups,
    promoteBackup,
    removeBackup,
    clearBackups,
    reorderBackups,
    selectBackup: setSelectedId,
    getInspection,
    setInspection,
    mergeResult,
    setMergeResult,
    mergeLogs,
    setMergeLogs,
    outputFileName,
    setOutputFileName
  };

  return <BackupStoreContext.Provider value={value}>{children}</BackupStoreContext.Provider>;
};

export function useBackupStore(): BackupStoreValue {
  const ctx = useContext(BackupStoreContext);
  if (!ctx) throw new Error('useBackupStore must be used within a BackupStoreProvider');
  return ctx;
}
