import React, { useState } from 'react';
import { LedgerBlock } from '../types/manuscript';
import {
  ShieldCheck,
  ShieldAlert,
  Link as LinkIcon,
  Key,
  CheckCircle,
  Search,
  Copy,
  Check,
  Database,
  ArrowRight,
  Upload,
  Cpu,
  UserCheck,
  Layers,
  Sparkles,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface ProvenanceLedgerProps {
  blocks: LedgerBlock[];
  isValid: boolean;
  brokenBlockIndex: number;
  failureReason: string;
  isTampered: boolean;
  currentMerkleRoot: string;
  authorityPublicKey: string;
  onTriggerTamper: () => void;
  onRestoreTamper: () => void;
}

export const ProvenanceLedger: React.FC<ProvenanceLedgerProps> = ({
  blocks,
  isValid,
  brokenBlockIndex,
  failureReason,
  isTampered,
  currentMerkleRoot,
  authorityPublicKey,
  onTriggerTamper,
  onRestoreTamper,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'explorer'>('timeline');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(3); // Default to Consensus OCR block
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredBlocks = blocks.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.blockHash.toLowerCase().includes(q) ||
      b.payloadHash.toLowerCase().includes(q) ||
      b.eventType.toLowerCase().includes(q) ||
      b.documentTitle.toLowerCase().includes(q)
    );
  });

  const activeBlock = blocks.find((b) => b.index === selectedBlockIndex) || blocks[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  // Helper to map event types to sequence display details
  const getEventMeta = (eventType: LedgerBlock['eventType']) => {
    switch (eventType) {
      case 'GENESIS':
        return {
          label: 'Genesis Root',
          stage: 'Phase 00',
          icon: Key,
          color: 'stone',
          description: 'Archival cryptographic initialization & root authority',
        };
      case 'INGESTION':
        return {
          label: 'Raw Capture & Upload',
          stage: 'Phase 01',
          icon: Upload,
          color: 'blue',
          description: 'High-res RAW scan ingestion & initial SHA-256 fingerprint',
        };
      case 'PREPROCESSING':
        return {
          label: 'Restoration & Deskew',
          stage: 'Phase 02',
          icon: Layers,
          color: 'amber',
          description: 'Homomorphic lighting fix, Sauvola binarization, & rotation',
        };
      case 'CONSENSUS_OCR':
        return {
          label: 'Consensus OCR (3-Engine)',
          stage: 'Phase 03',
          icon: Cpu,
          color: 'indigo',
          description: 'Tri-engine voting between Tesseract, TrOCR & Gemini Vision',
        };
      case 'DAMAGE_ANALYSIS':
        return {
          label: 'Damage Gap Quarantine',
          stage: 'Phase 04',
          icon: Sparkles,
          color: 'purple',
          description: 'Torn lacuna marked unreadable; separate AI conjecture layer',
        };
      case 'HUMAN_CORRECTION':
        return {
          label: 'Ground Truth Certification',
          stage: 'Phase 05',
          icon: UserCheck,
          color: 'emerald',
          description: 'Certified epigraphist verification appended to ledger',
        };
      default:
        return {
          label: eventType,
          stage: 'Event',
          icon: CheckCircle,
          color: 'stone',
          description: 'Immutable ledger transaction',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-sans block mb-1">
            Module 05 · Cryptographic Immutability
          </span>
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
            Provenance Ledger & Event Chain
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl font-manuscript text-lg">
            Every manuscript event (Upload → Restoration → Consensus OCR → Damage Isolation → Human Correction) forms an immutable SHA-256 hash-chain signed with Ed25519.
          </p>
        </div>

        {/* View Switcher Tabs & Tamper Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented View Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-md">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap shrink-0 ${
                viewMode === 'timeline'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Visual Timeline Sequence
            </button>
            <button
              onClick={() => setViewMode('explorer')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap shrink-0 ${
                viewMode === 'explorer'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Block Inspector List
            </button>
          </div>

          {/* Live Tamper Button */}
          {isTampered ? (
            <button
              onClick={onRestoreTamper}
              className="px-3.5 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Restore Authentic State
            </button>
          ) : (
            <button
              onClick={onTriggerTamper}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-rose-200" />
              Simulate Database Tamper
            </button>
          )}
        </div>
      </div>

      {/* Cryptographic Status Hero Banner */}
      {isValid ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-800 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-emerald-950">
                  Cryptographic Chain Intact · 100% Provenance Verified
                </span>
                <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-semibold">
                  ED25519 ACTIVE
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                All {blocks.length} blocks verify against the Dharohar Archival Authority public key. No history rewrites or unauthorized edits detected.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] text-emerald-700 block uppercase font-mono">Current Merkle Root</span>
            <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-100/80 px-2 py-1 rounded">
              {currentMerkleRoot.slice(0, 16)}...{currentMerkleRoot.slice(-8)}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-rose-200 rounded-lg text-rose-900 shrink-0">
              <ShieldAlert className="w-6 h-6 text-rose-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-rose-950">
                  CRITICAL: TAMPER DETECTED AT BLOCK #{brokenBlockIndex}
                </span>
                <span className="text-[10px] font-mono bg-rose-300 text-rose-950 px-2 py-0.5 rounded font-bold">
                  HASH MISMATCH
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5 max-w-2xl font-mono">
                {failureReason}
              </p>
            </div>
          </div>

          <button
            onClick={onRestoreTamper}
            className="px-4 py-2 bg-rose-700 text-white font-semibold text-xs rounded hover:bg-rose-800 shrink-0 cursor-pointer shadow-xs"
          >
            Revert Database Corruption
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. VISUAL TIMELINE SEQUENCE VIEW (Upload -> OCR -> Correction) */}
      {/* ============================================================== */}
      {viewMode === 'timeline' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                End-to-End Archival Lifecycle Sequence
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Sequential progression of cryptographic events with timestamped transitions and verification hash links.
              </p>
            </div>
            <div className="text-xs text-stone-500 font-mono bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Full Chain Depth: {blocks.length} Verified Events</span>
            </div>
          </div>

          {/* Timeline Rail Container */}
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
            {blocks.map((b, idx) => {
              const meta = getEventMeta(b.eventType);
              const EventIcon = meta.icon;
              const isSelected = activeBlock?.index === b.index;
              const isBroken = !isValid && b.index === brokenBlockIndex;

              return (
                <div key={b.index} className="relative group">
                  {/* Timeline Node Bullet on the Vertical Line */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isBroken
                        ? 'bg-rose-600 border-rose-300 text-white ring-4 ring-rose-200 animate-pulse'
                        : isSelected
                        ? 'bg-stone-900 border-white text-white ring-4 ring-stone-300 shadow-md'
                        : 'bg-white border-stone-300 text-stone-600 group-hover:border-stone-500'
                    }`}
                  >
                    <EventIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>

                  {/* Main Event Card */}
                  <div
                    onClick={() => setSelectedBlockIndex(b.index)}
                    className={`rounded-xl border p-5 transition-all cursor-pointer ${
                      isBroken
                        ? 'border-rose-400 bg-rose-50/70 ring-2 ring-rose-300 shadow-sm'
                        : isSelected
                        ? 'border-stone-900 bg-stone-50 shadow-md ring-1 ring-stone-900/10'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Event Step Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                          Block #{b.index}
                        </span>
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                          {meta.label}
                        </h3>
                        <span className="text-xs text-stone-400 hidden sm:inline">·</span>
                        <span className="text-xs text-stone-600 truncate max-w-xs">
                          {b.documentTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-stone-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {new Date(b.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isBroken
                              ? 'bg-rose-200 text-rose-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isBroken ? 'CHAIN COMPROMISED' : 'ED25519 VERIFIED'}
                        </span>
                      </div>
                    </div>

                    {/* Event Description & Payload Digest */}
                    <div className="py-3 text-xs text-stone-600 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <p className="max-w-xl text-stone-700 leading-relaxed">
                        {meta.description}
                      </p>

                      <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                        <span className="text-[11px] text-stone-500 font-mono">
                          Payload Digest:
                        </span>
                        <code className="text-[11px] font-mono bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-stone-800">
                          {b.payloadHash.slice(0, 10)}...{b.payloadHash.slice(-6)}
                        </code>
                      </div>
                    </div>

                    {/* Hash Links Connecting Strip */}
                    <div className="mt-2 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                      {/* Left: Previous Hash Link */}
                      <div className="flex items-center gap-1.5 text-stone-500">
                        <LinkIcon className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-[11px]">prevHash:</span>
                        <span
                          className={`text-[11px] ${
                            isBroken ? 'text-rose-700 font-bold' : 'text-stone-600'
                          }`}
                        >
                          {b.prevHash
                            ? `${b.prevHash.slice(0, 8)}...${b.prevHash.slice(-6)}`
                            : '00000000... (GENESIS)'}
                        </span>
                      </div>

                      {/* Right: Block Hash with 1-click Copy */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-500">blockHash:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(b.blockHash);
                          }}
                          className="flex items-center gap-1 text-[11px] text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded transition-colors"
                          title="Copy full block hash"
                        >
                          {copiedHash === b.blockHash ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-stone-500" />
                          )}
                          <span>
                            {b.blockHash.slice(0, 12)}...{b.blockHash.slice(-6)}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hash Transition Arrow Connector between Timeline Steps */}
                  {idx < blocks.length - 1 && (
                    <div className="my-2 ml-4 flex items-center gap-2 text-[11px] font-mono text-stone-400">
                      <div className="w-4 h-0.5 bg-stone-300" />
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider">
                        Chained via SHA-256 Link
                      </span>
                      <ArrowRight className="w-3 h-3 text-stone-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. DUAL COLUMN BLOCK INSPECTOR & MERKLE PROOF VIEW              */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Compact Block List (Visible in Explorer mode or as secondary list) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
              {viewMode === 'timeline' ? 'Quick Block Selector' : 'Ledger Block Index'}
            </span>
            <span className="text-xs text-stone-500 font-mono">
              {filteredBlocks.length} records
            </span>
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by hash, event type, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-md focus:outline-hidden focus:border-stone-900 font-mono text-stone-900 bg-white"
            />
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredBlocks.map((b) => {
              const isSelected = activeBlock?.index === b.index;
              const isBroken = !isValid && b.index === brokenBlockIndex;

              return (
                <div
                  key={b.index}
                  onClick={() => setSelectedBlockIndex(b.index)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isBroken
                      ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/50'
                      : isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                      : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-stone-800 text-amber-300'
                            : isBroken
                            ? 'bg-rose-200 text-rose-900'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        Block #{b.index}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${
                          isSelected ? 'text-stone-100' : isBroken ? 'text-rose-900' : 'text-stone-900'
                        }`}
                      >
                        {b.eventType}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-mono ${
                        isSelected ? 'text-stone-400' : 'text-stone-500'
                      }`}
                    >
                      {new Date(b.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="mt-1.5 text-xs truncate">
                    <span className={isSelected ? 'text-stone-300' : 'text-stone-600'}>
                      {b.documentTitle}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-stone-200/40 flex items-center justify-between text-[11px] font-mono">
                    <span className={isSelected ? 'text-stone-400' : 'text-stone-500'}>
                      {b.blockHash.slice(0, 8)}...{b.blockHash.slice(-6)}
                    </span>
                    <span
                      className={
                        isBroken
                          ? 'text-rose-700 font-bold'
                          : isSelected
                          ? 'text-emerald-400'
                          : 'text-emerald-700'
                      }
                    >
                      {isBroken ? 'BROKEN LINK' : 'SIGNATURE VALID'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Block Inspector & Merkle Proof */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-stone-500 font-sans block">
                Selected Event Cryptographic Payload
              </span>
              <h2 className="font-cinzel text-xl font-bold text-stone-900 mt-0.5">
                Block #{activeBlock.index} · {activeBlock.eventType}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500 block">Committed Timestamp</span>
              <span className="font-mono text-xs font-medium text-stone-800">
                {new Date(activeBlock.timestamp).toISOString()}
              </span>
            </div>
          </div>

          {/* Cryptographic Hashes Table */}
          <div className="space-y-3">
            {/* Block Hash */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-stone-600" />
                  Block Hash (SHA-256)
                </span>
                <button
                  onClick={() => handleCopy(activeBlock.blockHash)}
                  className="text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1 text-[11px]"
                >
                  {copiedHash === activeBlock.blockHash ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copiedHash === activeBlock.blockHash ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="font-mono text-xs text-stone-900 break-all select-all">
                {activeBlock.blockHash}
              </p>
            </div>

            {/* Previous Hash Link */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-stone-600" />
                  Previous Block Pointer (prevHash)
                </span>
                <button
                  onClick={() => handleCopy(activeBlock.prevHash)}
                  className="text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1 text-[11px]"
                >
                  {copiedHash === activeBlock.prevHash ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copiedHash === activeBlock.prevHash ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="font-mono text-xs text-stone-600 break-all select-all">
                {activeBlock.prevHash ||
                  '0000000000000000000000000000000000000000000000000000000000000000'}
              </p>
            </div>

            {/* Payload Hash */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">Payload Hash</span>
                <span className="font-mono text-[11px] text-stone-500">
                  SHA-256(canonical_json)
                </span>
              </div>
              <p className="font-mono text-xs text-stone-700 break-all">
                {activeBlock.payloadHash}
              </p>
            </div>
          </div>

          {/* Payload Raw Content Display */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-stone-800 uppercase tracking-wide block">
              Event Payload & Metadata
            </span>
            <div className="bg-stone-900 text-stone-100 rounded-lg p-3.5 font-mono text-xs overflow-x-auto max-h-48 border border-stone-800">
              <pre>{JSON.stringify(activeBlock.payload, null, 2)}</pre>
            </div>
          </div>

          {/* Ed25519 Signature Verification Section */}
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Ed25519 Archival Authority Signature
              </span>
              <span className="font-mono text-[11px] text-stone-500">
                64-byte Ed25519 signature
              </span>
            </div>
            <p className="font-mono text-[11px] text-stone-600 truncate">
              Sig: {activeBlock.signature}
            </p>
            <p className="text-[11px] text-stone-500">
              Authority: {activeBlock.signedBy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
