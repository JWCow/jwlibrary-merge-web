import React, { useState, useRef } from 'react';
import { UploadCloud, FileArchive, AlertCircle, Loader2 } from 'lucide-react';
import { inspectBackupFile } from '../lib/inspect';
import type { BackupMetadata } from '../lib/types';

interface DropZoneProps {
  onFilesLoaded: (backups: BackupMetadata[]) => void;
  isLoading?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesLoaded, isLoading = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.toLowerCase().endsWith('.jwlibrary') || file.name.toLowerCase().endsWith('.zip')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setErrorMessage('Please select valid .jwlibrary backup files.');
      return;
    }

    setProcessing(true);
    const loadedBackups: BackupMetadata[] = [];
    const errors: string[] = [];

    for (const file of validFiles) {
      try {
        const metadata = await inspectBackupFile(file);
        loadedBackups.push(metadata);
      } catch (err: any) {
        console.error(`Error loading ${file.name}:`, err);
        errors.push(`${file.name}: ${err.message || 'Corrupted or invalid backup file'}`);
      }
    }

    setProcessing(false);

    if (errors.length > 0) {
      setErrorMessage(errors.join(' | '));
    }

    if (loadedBackups.length > 0) {
      onFilesLoaded(loadedBackups);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const busy = isLoading || processing;

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !busy && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-theocratic-500 bg-theocratic-50/50 dark:bg-theocratic-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-theocratic-400 dark:hover:border-theocratic-500 bg-white/50 dark:bg-slate-900/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".jwlibrary,.zip"
          className="hidden"
          disabled={busy}
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform ${
            isDragOver ? 'scale-110' : ''
          } ${
            busy 
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
              : 'bg-theocratic-100 dark:bg-theocratic-950/80 text-theocratic-600 dark:text-theocratic-400'
          }`}>
            {busy ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
              {busy ? 'Inspecting JW Library Backups...' : 'Drop your .jwlibrary backup files here'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Select 2 or more backups to merge (e.g. from your iPad, iPhone, and PC).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center gap-1.5">
              <FileArchive className="w-3.5 h-3.5 text-theocratic-500" /> .jwlibrary format
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80">
              Multiple files supported
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              100% In-Browser
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}
    </div>
  );
};
