import React, { useState } from 'react';
import { WordItem, Manuscript } from '../types/manuscript';
import { CheckCircle2, AlertCircle, Sparkles, Cpu, Eye, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';

interface ConsensusViewerProps {
  currentDoc: Manuscript;
  words: WordItem[];
  selectedWordId: string | null;
  onSelectWord: (wordId: string) => void;
  onProceedToReview: () => void;
  onRunLiveGeminiOCR: () => void;
  isLoadingOCR: boolean;
}

export const ConsensusViewer: React.FC<ConsensusViewerProps> = ({
  currentDoc,
  words,
  selectedWordId,
  onSelectWord,
  onProceedToReview,
  onRunLiveGeminiOCR,
  isLoadingOCR,
}) => {
  const selectedWord = words.find((w) => w.id === selectedWordId) || words[0] || null;

  // Confidence distribution statistics
  const highConfCount = words.filter((w) => w.confidence >= 0.9).length;
  const medConfCount = words.filter((w) => w.confidence >= 0.7 && w.confidence < 0.9).length;
  const lowConfCount = words.filter((w) => w.confidence < 0.7 || w.isDamagedGap).length;
  const avgConfidence = words.length > 0
    ? (words.reduce((acc, w) => acc + w.confidence, 0) / words.length * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-sans block mb-1">
            Module 02 · Tri-Engine Voting Architecture
          </span>
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
            Multi-Engine Consensus OCR
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl font-manuscript text-lg">
            Word-level voting between Tesseract, TrOCR, and Gemini 3.8 Flash Vision LLM. Disagreements and low-confidence readings are isolated for human verification.
          </p>
        </div>

        {/* Engine Status & Re-run */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRunLiveGeminiOCR}
            disabled={isLoadingOCR}
            className="px-3.5 py-2 text-xs font-semibold text-stone-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            {isLoadingOCR ? 'Querying Gemini 3.8 Flash...' : 'Re-Run Live Vision Arbiter'}
          </button>
        </div>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
        <div>
          <span className="text-xs text-stone-500 block">Total Tokens Extracted</span>
          <span className="text-xl font-bold font-mono text-stone-900 tabular-nums">{words.length}</span>
        </div>
        <div>
          <span className="text-xs text-stone-500 block">Mean Consensus Confidence</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">{avgConfidence}%</span>
        </div>
        <div>
          <span className="text-xs text-stone-500 block">High Agreement (3/3)</span>
          <span className="text-xl font-bold font-mono text-stone-800 tabular-nums">{highConfCount} words</span>
        </div>
        <div>
          <span className="text-xs text-stone-500 block">Flagged Disagreements / Gaps</span>
          <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">{lowConfCount} flagged</span>
        </div>
      </div>

      {/* Main Two-Column Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Manuscript Folio Viewer */}
        <div className="lg:col-span-7 bg-stone-900 rounded-xl p-3 border border-stone-800 shadow-md flex flex-col">
          <div className="flex items-center justify-between px-2 py-1 mb-2 text-xs text-stone-400">
            <span className="font-mono text-stone-300">Bounding Box Interactive Layer</span>
            <span className="text-stone-400">Click any word to inspect 3-engine votes</span>
          </div>

          <div className="relative w-full overflow-hidden rounded-lg bg-stone-950 flex items-center justify-center min-h-[380px]">
            <img
              src={currentDoc.image}
              alt={currentDoc.title}
              referrerPolicy="no-referrer"
              className="max-h-[500px] w-auto object-contain select-none"
            />

            {/* Bounding Box Highlights */}
            <div className="absolute inset-0 pointer-events-auto">
              {words.map((w) => {
                const isSelected = selectedWord?.id === w.id;
                // Normalized coordinates
                const top = `${w.bbox.ymin / 10}%`;
                const left = `${w.bbox.xmin / 10}%`;
                const height = `${(w.bbox.ymax - w.bbox.ymin) / 10}%`;
                const width = `${(w.bbox.xmax - w.bbox.xmin) / 10}%`;

                // Confidence color coding
                let borderColor = 'border-emerald-400/80 bg-emerald-500/15';
                if (w.isDamagedGap) {
                  borderColor = 'border-purple-400 border-dashed bg-purple-500/25';
                } else if (w.confidence < 0.75) {
                  borderColor = 'border-rose-400 bg-rose-500/25 animate-pulse';
                } else if (w.confidence < 0.9) {
                  borderColor = 'border-amber-400 bg-amber-500/20';
                }

                return (
                  <button
                    key={w.id}
                    onClick={() => onSelectWord(w.id)}
                    style={{ top, left, height, width }}
                    className={`absolute rounded transition-all cursor-pointer border ${borderColor} ${
                      isSelected ? 'ring-2 ring-white scale-105 z-20' : 'hover:scale-102 hover:border-white'
                    }`}
                    title={`${w.consensusText} (${Math.round(w.confidence * 100)}%)`}
                  >
                    <span className="absolute -top-4 left-0 bg-stone-900/90 text-stone-100 text-[10px] font-mono px-1 rounded shadow-xs whitespace-nowrap">
                      {Math.round(w.confidence * 100)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Legend */}
          <div className="flex items-center justify-between text-xs text-stone-400 px-3 pt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60 border border-emerald-400 inline-block" />
                Consensus (&gt;90%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/60 border border-amber-400 inline-block" />
                Partial (70-89%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/60 border border-rose-400 inline-block" />
                Disagreement (&lt;70%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/60 border border-purple-400 border-dashed inline-block" />
                Torn / Faded Gap
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Tri-Engine Voting Matrix & Arbiter Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          {selectedWord ? (
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-stone-500 font-sans block">
                    Selected Token Inspection
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold font-manuscript text-stone-900">
                      {selectedWord.consensusText}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      ID: {selectedWord.id}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Consensus Score</span>
                  <span
                    className={`text-lg font-bold font-mono tabular-nums ${
                      selectedWord.confidence >= 0.9
                        ? 'text-emerald-700'
                        : selectedWord.confidence >= 0.75
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {(selectedWord.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* 3 Engine Voting Breakdown */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-stone-800 uppercase tracking-wide block">
                  Individual Engine Voting Log
                </span>

                {/* Engine 1: Tesseract */}
                <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-stone-600" />
                    <div>
                      <span className="font-semibold text-stone-800 block">Tesseract v5.3 (Classical OCR)</span>
                      <span className="text-stone-500 text-[11px]">Binarized geometry match</span>
                    </div>
                  </div>
                  <span className="font-mono font-medium text-stone-900 px-2 py-1 bg-white border border-stone-200 rounded text-sm">
                    {selectedWord.tesseractVote}
                  </span>
                </div>

                {/* Engine 2: TrOCR */}
                <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    <div>
                      <span className="font-semibold text-stone-800 block">TrOCR-Indic (Vision-Encoder)</span>
                      <span className="text-stone-500 text-[11px]">Sequence autoregressive decoder</span>
                    </div>
                  </div>
                  <span className="font-mono font-medium text-stone-900 px-2 py-1 bg-white border border-stone-200 rounded text-sm">
                    {selectedWord.trocrVote}
                  </span>
                </div>

                {/* Engine 3: Gemini 3.8 Flash Vision */}
                <div className="flex items-center justify-between p-2.5 bg-amber-50/70 rounded-lg border border-amber-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <div>
                      <span className="font-semibold text-amber-950 block">Gemini 3.8 Flash (Multimodal LLM)</span>
                      <span className="text-amber-800 text-[11px]">Philological script context arbiter</span>
                    </div>
                  </div>
                  <span className="font-mono font-medium text-amber-950 px-2 py-1 bg-white border border-amber-300 rounded text-sm">
                    {selectedWord.geminiVote}
                  </span>
                </div>
              </div>

              {/* Arbiter Explanation & Status */}
              <div className="p-3 bg-stone-100 rounded-lg text-xs space-y-1">
                <span className="font-semibold text-stone-800 block">Consensus Decision:</span>
                <p className="text-stone-600">
                  {selectedWord.confidence >= 0.9 ? (
                    'Unanimous 3/3 engine alignment. Token marked as Verified Ground Truth candidate.'
                  ) : selectedWord.isDamagedGap ? (
                    'Physical folio damage detected. Classified as Unreadable Gap; philological AI suggestion quarantined.'
                  ) : (
                    'Engine disagreement detected. Disagreement logged into ledger for human review in Review Queue.'
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={onProceedToReview}
                  className="flex-1 py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  Open in Human Review Queue
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-stone-200 rounded-xl text-stone-500 text-xs">
              Select a word on the manuscript to view 3-engine consensus votes.
            </div>
          )}

          {/* Full Line Flow Display */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-sans block mb-2">
              Continuous Line Transcription
            </span>
            <div className="flex flex-wrap gap-1.5 p-3 bg-stone-50 rounded-lg border border-stone-200 font-manuscript text-lg leading-relaxed">
              {words.map((w) => (
                <button
                  key={w.id}
                  onClick={() => onSelectWord(w.id)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    selectedWord?.id === w.id
                      ? 'bg-stone-900 text-white'
                      : w.isDamagedGap
                      ? 'bg-purple-100 text-purple-900 border border-purple-300 border-dashed'
                      : w.confidence < 0.75
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'hover:bg-stone-200 text-stone-900'
                  }`}
                >
                  {w.consensusText}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
