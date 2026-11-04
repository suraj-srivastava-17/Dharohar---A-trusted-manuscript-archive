import React from 'react';
import { AlertTriangle, ShieldCheck, Database, X, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';

interface TamperDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTampered: boolean;
  onTriggerTamper: () => void;
  onRestoreTamper: () => void;
  onViewVerifyPage: () => void;
}

export const TamperDemoModal: React.FC<TamperDemoModalProps> = ({
  isOpen,
  onClose,
  isTampered,
  onTriggerTamper,
  onRestoreTamper,
  onViewVerifyPage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-300 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${
          isTampered ? 'bg-rose-50 border-rose-200' : 'bg-stone-50 border-stone-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isTampered ? 'bg-rose-200 text-rose-800' : 'bg-stone-200 text-stone-800'}`}>
              {isTampered ? <AlertTriangle className="w-5 h-5 text-rose-700" /> : <Database className="w-5 h-5 text-stone-700" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Phase 2 Booth Showstopper: Live Database Tamper Demo
              </h2>
              <p className="text-xs text-stone-600">
                Demonstrating real-time cryptographic detection of unauthorized backend record modification.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="text-xs text-stone-700 leading-relaxed space-y-2">
            <p>
              In traditional archival databases, anyone with database administrator privileges or SQL injection access can silently alter historical dates, king genealogies, or disputed inscription words without leaving a trace.
            </p>
            <p>
              <strong>Dharohar's cryptographic defense:</strong> Every event is chained with <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">prev_hash</code>, sealed into a daily Merkle tree, and signed with <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">Ed25519</code>. Modifying even 1 single byte immediately breaks the hash chain!
            </p>
          </div>

          {/* Interactive Simulation Terminal Box */}
          <div className="bg-stone-900 rounded-xl p-4 text-xs font-mono text-stone-200 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-stone-400 border-b border-stone-800 pb-2">
              <span>SQL Database Direct Execution Console</span>
              <span className={isTampered ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {isTampered ? 'DATABASE COMPROMISED' : 'DATABASE CANONICAL'}
              </span>
            </div>

            <div className="space-y-1 text-stone-300">
              <p className="text-stone-500">-- Targeted row: ledger_events WHERE block_index = 3</p>
              <p className="text-amber-400">
                {isTampered
                  ? "UPDATE ledger_events SET payload = jsonb_set(payload, '{agreementRate}', '\"100.0% (Tampered)\"') WHERE index = 3;"
                  : "-- Ready to inject tamper test into raw storage"}
              </p>
              {isTampered && (
                <p className="text-rose-400 mt-2">
                  [!] Payload SHA-256 recalculated: Hash mismatch! Expected 3b7e... but computed a19d... Chain linkage broken!
                </p>
              )}
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {isTampered ? (
              <button
                onClick={onRestoreTamper}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                Restore to Authentic Cryptographic State
              </button>
            ) : (
              <button
                onClick={onTriggerTamper}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-md flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-rose-200" />
                Inject Database Tamper Now
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onViewVerifyPage();
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Inspect Broken Block in Verify Page
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
