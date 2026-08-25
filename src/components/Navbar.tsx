import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, Search, ShieldCheck, Sun, Moon, Database, QrCode } from 'lucide-react';
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
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-theocratic-600 to-theocratic-400 flex items-center justify-center text-white shadow-md shadow-theocratic-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-theocratic-700 via-theocratic-600 to-theocratic-500 dark:from-theocratic-300 dark:to-theocratic-400 bg-clip-text text-transparent block">
                JWL Merger
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                Merge .jwlibrary backups in your browser
              </p>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  title={link.label}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    active
                      ? 'bg-theocratic-50 text-theocratic-700 dark:bg-theocratic-950/60 dark:text-theocratic-300 border border-theocratic-200/80 dark:border-theocratic-800/60 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}

            {/* Open on Phone / QR Code */}
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-theocratic-600 dark:hover:text-theocratic-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              title="Open on iPhone / iPad (Scan QR Code)"
              aria-label="Open on Mobile via QR"
            >
              <QrCode className="w-4 h-4 text-theocratic-500 flex-shrink-0" />
              <span className="hidden lg:inline">Mobile QR</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />}
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
