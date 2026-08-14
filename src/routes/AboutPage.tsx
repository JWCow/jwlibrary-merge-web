import React from 'react';
import { 
  CheckCircle2, 
  Lock, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-800 dark:text-slate-200">
      
      {/* Title */}
      <div className="text-center sm:text-left space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Privacy & Simple Guide
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Everything you need to know about keeping your personal study notes safe and combining your devices.
        </p>
      </div>

      {/* Main Privacy Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/50 dark:via-slate-900 dark:to-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-lg shadow-emerald-500/5 space-y-4">
        <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300 font-bold text-lg sm:text-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <span>Your Data Stays 100% On Your Device</span>
        </div>

        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          Your personal study notes, highlighted scriptures, and meeting preparations are completely private. 
          When you use this website, <strong>no files or notes are ever uploaded to any server or seen by anyone</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Zero file uploads or cloud storage</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>No account, sign-in, or password needed</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Works completely offline in your browser</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>100% free and private for personal study</span>
          </div>
        </div>
      </div>

      {/* Simple 3-Step Guide */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-theocratic-500" />
          How to Use This Tool (3 Simple Steps)
        </h2>

        <div className="grid grid-cols-1 gap-3">
          
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-700 dark:text-theocratic-300 font-bold text-sm flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Create Backups on Your Devices</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                In <strong>JW Library</strong> on each device (iPad, iPhone, Android, or PC), tap the menu <strong>(☰)</strong> &rarr; <strong>Personal Study</strong> &rarr; <strong>Backup and Restore</strong> &rarr; <strong>Create Backup</strong>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-700 dark:text-theocratic-300 font-bold text-sm flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Drop and Merge</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Drag your backup files into the merger on this site and click <strong>Merge Backups</strong>. It combines everything in less than a second.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-700 dark:text-theocratic-300 font-bold text-sm flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Restore on Any Device</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Download the merged file and restore it on your devices (<strong>Restore Backup</strong>). Now all your devices have the same unified notes!
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Common Questions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-theocratic-500" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Will I lose any highlights or study notes?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              No. The merger combines all highlights, notes, tags, and bookmarks from all your devices. If you edited the exact same note on two devices, the newer version is kept so nothing is lost.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Can I merge more than two devices at once?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Yes! You can select 2, 3, 4 or more backups (e.g. from your iPad, iPhone, laptop, and desktop) and merge them all into a single file in one click.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              What devices are supported?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              All devices that run JW Library: Apple (iPad, iPhone, Mac), Android phones & tablets, and Windows PC.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
