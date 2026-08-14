import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, Search, ShieldCheck, Sun, Moon, Sparkles, Database, QrCode } from 'lucide-react';
import { QRCodeModal } from './QRCodeModal';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  const location = useLocation();
  const [showQR, setShowQR] = useState(false);

  const navLinks = [
    { path: '/', label: 'Merger Tool', icon: Layers },
    { path: '/inspect', label: 'Backup Explorer', icon: Search },
    { path: '/about', label: 'Privacy & Guide', icon: ShieldCheck },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-theocratic-600 to-theocratic-400 flex items-center justify-center text-white shadow-md shadow-theocratic-500/20 group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg bg-gradient-to-r from-theocratic-700 via-theocratic-600 to-theocratic-500 dark:from-theocratic-300 dark:to-theocratic-400 bg-clip-text text-transparent">
                  JWL Merger
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> 100% Client-Side
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Merge .jwlibrary backups in your browser
              </p>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-theocratic-50 text-theocratic-700 dark:bg-theocratic-950/60 dark:text-theocratic-300 border border-theocratic-200/80 dark:border-theocratic-800/60 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Open on Phone / QR Code */}
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-theocratic-600 dark:hover:text-theocratic-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors ml-1"
              title="Open on iPhone / iPad (Scan QR Code)"
            >
              <QrCode className="w-4 h-4 text-theocratic-500" />
              <span className="hidden md:inline">Mobile QR</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="p-2 ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </nav>

        </div>
      </header>

      {/* QR Code Modal */}
      <QRCodeModal
        url="https://jwlibrary-merge.mastern8n.cc"
        isOpen={showQR}
        onClose={() => setShowQR(false)}
      />
    </>
  );
};
