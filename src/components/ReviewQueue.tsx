import React, { useState } from 'react';
import { WordItem, Manuscript } from '../types/manuscript';
import { Check, Edit3, UserCheck, ShieldCheck, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

interface ReviewQueueProps {
  currentDoc: Manuscript;
  words: WordItem[];
  onSaveCorrection: (wordId: string, correctedText: string, reviewerName: string, notes?: string) => Promise<void>;
  isSaving: boolean;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  currentDoc,
  words,
  onSaveCorrection,
  isSaving,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'flagged' | 'unreviewed'>('flagged');
  const [selectedWordIndex, setSelectedWordIndex] = useState<number>(0);
  const [reviewerName, setReviewerName] = useState<string>('Dr. S. K. Upadhyaya (Epigraphist)');
  const [editText, setEditText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter items
  const filteredWords = words.filter((w) => {
    if (filterMode === 'flagged') return w.confidence < 0.85 || w.isDamagedGap || w.humanReviewStatus === 'flagged';
    if (filterMode === 'unreviewed') return w.humanReviewStatus === 'unreviewed';
    return true;
  });

  const activeWord = filteredWords[selectedWordIndex] || filteredWords[0] || words[0];

  // Update edit text when active word changes
  React.useEffect(() => {
    if (activeWord) {
      setEditText(activeWord.humanCorrection || activeWord.consensusText);
      setNotes('');
      setSaveSuccessMsg(null);
    }
  }, [activeWord]);

  const handleNext = () => {
    if (selectedWordIndex < filteredWords.length - 1) {
      setSelectedWordIndex(selectedWordIndex + 1);
    }
  };

  const handlePrev = () => {
    if (selectedWordIndex > 0) {
      setSelectedWordIndex(selectedWordIndex - 1);
    }
  };

  const handleApplyQuickChoice = (text: string) => {
    setEditText(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWord || !editText.trim()) return;

    await onSaveCorrection(activeWord.id, editText.trim(), reviewerName, notes);
    setSaveSuccessMsg(`Word #${activeWord.id} certified and appended to Provenance Ledger!`);
    setTimeout(() => {
      setSaveSuccessMsg(null);
      handleNext();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-sans block mb-1">
            Module 04 · Expert Human-In-The-Loop
          </span>
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
            Archival Verification & Ground Truth Queue
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl font-manuscript text-lg">
            Low-confidence readings and multi-engine disagreements are presented with high-magnification folio crops. Certified epigraphist edits are committed to the cryptographic ledger.
          </p>
        </div>

        {/* Filter Controls (Segmented Tabs) */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-md">
          <button
            onClick={() => {
              setFilterMode('flagged');
              setSelectedWordIndex(0);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap shrink-0 ${
              filterMode === 'flagged' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Disagreements & Gaps ({words.filter((w) => w.confidence < 0.85 || w.isDamagedGap).length})
          </button>
          <button
            onClick={() => {
              setFilterMode('unreviewed');
              setSelectedWordIndex(0);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap shrink-0 ${
              filterMode === 'unreviewed' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pending Review ({words.filter((w) => w.humanReviewStatus === 'unreviewed').length})
          </button>
          <button
            onClick={() => {
              setFilterMode('all');
              setSelectedWordIndex(0);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap shrink-0 ${
              filterMode === 'all' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Words ({words.length})
          </button>
        </div>
      </div>

      {filteredWords.length === 0 ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-3">
          <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
          <h2 className="text-base font-semibold text-stone-900">Review Queue Complete</h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            All flagged words for this folio have been verified or resolved against multi-engine consensus.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Word Queue Navigation & Folio Loupe Snippet */}
          <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs text-stone-500 font-mono">
                  Token {selectedWordIndex + 1} of {filteredWords.length}
                </span>
                <h2 className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  ID: {activeWord.id}
                </h2>
              </div>

              {/* Prev / Next navigation */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  disabled={selectedWordIndex === 0}
                  className="p-1.5 rounded border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                  title="Previous Token"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedWordIndex === filteredWords.length - 1}
                  className="p-1.5 rounded border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                  title="Next Token"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulated Folio Magnified Loupe Viewer */}
            <div className="relative bg-stone-900 rounded-lg p-3 overflow-hidden border border-stone-800 flex flex-col items-center">
              <span className="text-[11px] text-stone-400 self-start mb-2 font-mono">
                Magnified Folio Loupe (UV Inscription Extract)
              </span>

              <div className="relative w-full h-44 bg-stone-950 rounded overflow-hidden flex items-center justify-center border border-stone-800">
                <img
                  src={currentDoc.image}
                  alt={currentDoc.title}
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `scale(2.8) translate(${-(activeWord.bbox.xmin - 400) / 7}px, ${-(activeWord.bbox.ymin - 300) / 7}px)`,
                  }}
                  className="max-w-none transition-transform duration-300 pointer-events-none select-none filter contrast-125"
                />
                {/* Loupe reticle crosshair */}
                <div className="absolute inset-0 pointer-events-none border border-amber-400/30 flex items-center justify-center">
                  <div className="w-16 h-16 border border-amber-400/60 rounded-full" />
                </div>
              </div>

              <div className="w-full flex items-center justify-between text-[11px] text-stone-400 mt-2 px-1">
                <span>Normalized BBox: [{activeWord.bbox.ymin}, {activeWord.bbox.xmin}]</span>
                <span className="text-amber-400">Zoom: 280%</span>
              </div>
            </div>

            {/* List of queue items */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-semibold uppercase text-stone-500 tracking-wide block mb-1">
                Queue Tokens
              </span>
              {filteredWords.map((w, idx) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWordIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-md border text-xs flex items-center justify-between transition-colors ${
                    activeWord.id === w.id
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] opacity-70">#{w.id}</span>
                    <span className="font-manuscript text-sm font-semibold">{w.humanCorrection || w.consensusText}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    activeWord.id === w.id
                      ? 'bg-stone-800 text-stone-200'
                      : w.confidence < 0.75
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-stone-200 text-stone-700'
                  }`}>
                    {Math.round(w.confidence * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Ground Truth Correction & Sign-Off Form */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-stone-500 font-sans block">
                  Ground Truth Certification
                </span>
                <h3 className="font-cinzel text-xl font-bold text-stone-900 mt-0.5">
                  Verify & Correct Token #{activeWord.id}
                </h3>
              </div>
              <span className={`text-xs font-mono font-semibold px-2 py-1 rounded ${
                activeWord.humanReviewStatus === 'verified' || activeWord.humanReviewStatus === 'corrected'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {activeWord.humanReviewStatus.toUpperCase()}
              </span>
            </div>

            {/* Quick Engine Suggestions */}
            <div>
              <span className="text-xs font-semibold text-stone-800 uppercase tracking-wide block mb-2">
                1-Click Engine Pre-fills
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyQuickChoice(activeWord.geminiVote)}
                  className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-left transition-colors cursor-pointer text-xs"
                >
                  <span className="text-[10px] text-amber-800 font-semibold block">Gemini 3.8 Flash</span>
                  <span className="font-manuscript text-base font-bold text-amber-950 block mt-0.5">
                    {activeWord.geminiVote}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyQuickChoice(activeWord.trocrVote)}
                  className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left transition-colors cursor-pointer text-xs"
                >
                  <span className="text-[10px] text-stone-600 font-semibold block">TrOCR Model</span>
                  <span className="font-manuscript text-base font-bold text-stone-900 block mt-0.5">
                    {activeWord.trocrVote}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyQuickChoice(activeWord.tesseractVote)}
                  className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left transition-colors cursor-pointer text-xs"
                >
                  <span className="text-[10px] text-stone-600 font-semibold block">Tesseract v5.3</span>
                  <span className="font-manuscript text-base font-bold text-stone-900 block mt-0.5">
                    {activeWord.tesseractVote}
                  </span>
                </button>
              </div>
            </div>

            {/* Correction Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-800 block mb-1">
                  Certified Ground Truth Text (Devanagari / Indic Unicode)
                </label>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-md font-manuscript text-xl text-stone-900 focus:outline-hidden focus:border-stone-900 shadow-2xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-800 block mb-1">
                    Reviewer Identity & Title
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-800 block mb-1">
                    Epigraphical Notes / Evidence
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Verified ligature under UV lamp illumination"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                  />
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Archival Invariant Notice */}
              <div className="text-[11px] text-stone-500 bg-stone-50 p-3 rounded border border-stone-200">
                <strong>Immutability Guarantee:</strong> Your correction does NOT overwrite previous raw OCR engine votes. It signs an append-only <code className="font-mono text-stone-700">HUMAN_CORRECTION</code> block to the Ed25519 hash-chain.
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {isSaving ? 'Signing & Hashing...' : 'Sign & Certify Ground Truth'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
