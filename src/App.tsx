import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MergerPage } from './routes/MergerPage';
import { InspectorPage } from './routes/InspectorPage';
import { AboutPage } from './routes/AboutPage';
import { ShieldCheck, Database } from 'lucide-react';
import { BackupStoreProvider } from './lib/backupStore';

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <BackupStoreProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        
        {/* Navigation Bar */}
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

        {/* Main Routed Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<MergerPage />} />
            <Route path="/inspect" element={<InspectorPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-8 px-4 mt-12 transition-colors">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-theocratic-500" />
              <span>JW Library Backup Merger • 100% In-Browser & Private</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> WebAssembly SQLite
              </span>
              <span>•</span>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-theocratic-500 transition-colors flex items-center gap-1"
              >
                <span>GitHub Submodule</span>
              </a>
            </div>
          </div>
        </footer>

      </div>
      </BackupStoreProvider>
    </BrowserRouter>
  );
}

export default App;
