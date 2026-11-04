import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'capture' | 'consensus' | 'damage' | 'review' | 'ledger' | 'search' | 'benchmark';
  setActiveTab: (tab: 'capture' | 'consensus' | 'damage' | 'review' | 'ledger' | 'search' | 'benchmark') => void;
  isTampered: boolean;
  onOpenTamperDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isTampered,
  onOpenTamperDemo,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              onClick={() => setActiveTab('consensus')}
              className="font-cinzel text-xl font-bold tracking-wider text-stone-900 cursor-pointer whitespace-nowrap shrink-0 hover:text-amber-900 transition-colors"
            >
              DHAROHAR
            </span>
            <span className="text-xs uppercase tracking-widest text-stone-500 font-sans hidden sm:inline">
              · Manuscript Archive
            </span>
          </div>

          {/* Zone 2: 4–5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            <button
              onClick={() => setActiveTab('capture')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'capture'
                  ? 'text-stone-900 font-semibold border-b-2 border-stone-900'
                  : 'hover:text-stone-900'
              }`}
            >
              Restore & Capture
            </button>
            <button
              onClick={() => setActiveTab('consensus')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'consensus'
                  ? 'text-stone-900 font-semibold border-b-2 border-stone-900'
                  : 'hover:text-stone-900'
              }`}
            >
              Consensus OCR
            </button>
            <button
              onClick={() => setActiveTab('damage')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'damage'
                  ? 'text-stone-900 font-semibold border-b-2 border-stone-900'
                  : 'hover:text-stone-900'
              }`}
            >
              Damage Analysis
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'review'
                  ? 'text-stone-900 font-semibold border-b-2 border-stone-900'
                  : 'hover:text-stone-900'
              }`}
            >
              Review Queue
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'ledger'
                  ? 'text-stone-900 font-semibold border-b-2 border-stone-900'
                  : 'hover:text-stone-900'
              }`}
            >
              Provenance Ledger
              {isTampered && (
                <span className="inline-flex items-center text-xs text-rose-700 font-mono font-bold">
                  [BREACH]
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenTamperDemo}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs ${
                isTampered
                  ? 'bg-rose-700 hover:bg-rose-800 text-white animate-pulse'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-100'
              }`}
            >
              {isTampered ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  Tamper Active: Verify Ledger
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Simulate Database Tamper
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
