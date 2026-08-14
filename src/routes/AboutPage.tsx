import { ShieldCheck, Database, Layers, CheckCircle2, Globe } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-800 dark:text-slate-200">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Privacy, Architecture & Documentation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          How JW Library Backup Merger works, its privacy guarantees, and technical design.
        </p>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-bold text-lg">
          <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <span>100% Client-Side Privacy Guarantee</span>
        </div>
        <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
          Your personal study notes, congregation reports, and highlighted scriptures contain deeply personal information. 
          This web application runs <strong>entirely in your web browser</strong> using WebAssembly SQLite (<code className="font-mono text-xs bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">sql.js</code>) and pure JavaScript ZIP manipulation (<code className="font-mono text-xs bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">JSZip</code>).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero server uploads or database storage</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Works offline after initial load</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero analytics or tracking scripts</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Open-source and auditable code</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-theocratic-500" />
          The <code className="font-mono text-base">.jwlibrary</code> File Format
        </h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          A <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.jwlibrary</code> file is standard ZIP archive containing:
        </p>
        <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-2 pl-2">
          <li>
            <strong className="font-mono">manifest.json:</strong> Metadata describing the database name, creation timestamp, device name, schema version, and cryptographic <strong>SHA-256 hash</strong> of <code className="font-mono text-xs">userData.db</code>. <em>JW Library requires this to be the very first entry inside the ZIP archive.</em>
          </li>
          <li>
            <strong className="font-mono">userData.db:</strong> An SQLite database storing all user tables: <code className="font-mono text-xs">Location</code>, <code className="font-mono text-xs">UserMark</code>, <code className="font-mono text-xs">BlockRange</code>, <code className="font-mono text-xs">Note</code>, <code className="font-mono text-xs">Tag</code>, <code className="font-mono text-xs">TagMap</code>, <code className="font-mono text-xs">Bookmark</code>, and <code className="font-mono text-xs">InputField</code>.
          </li>
        </ul>
      </div>

      {/* Healing the Multi-Paragraph Highlight Bug */}
      <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-theocratic-500" />
          The Multi-Block Highlight Problem (Solved)
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Traditional third-party merge utilities often store only one <code className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-1 rounded">BlockRange</code> per <code className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-1 rounded">UserMark</code>. When highlights span across multiple paragraphs or Bible verses, older tools silently discard all subsequent blocks, truncating your highlights.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          This web merger reconstructs the entire relation graph by mapping every <code className="font-mono text-xs">UserMarkGuid</code> to its complete set of multi-paragraph <code className="font-mono text-xs">BlockRange</code> spans, ensuring 100% fidelity with zero dropped highlights.
        </p>
      </div>

      {/* Deployment & Git */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-theocratic-500" />
          Deploying to Cloudflare Pages
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This project is ready to build and deploy to Cloudflare Pages as a high-speed static web app:
        </p>
        <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs space-y-2">
          <div className="text-slate-400"># 1. Build the production bundle</div>
          <div>npm run build</div>
          <div className="text-slate-400 pt-2"># 2. Deploy to Cloudflare Pages (or connect your GitHub repo)</div>
          <div>npx wrangler pages deploy dist</div>
        </div>
      </div>

    </div>
  );
};
