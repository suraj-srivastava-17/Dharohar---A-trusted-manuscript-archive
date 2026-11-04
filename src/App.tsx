import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { PreprocessViewer } from './components/PreprocessViewer';
import { ConsensusViewer } from './components/ConsensusViewer';
import { DamageAwareViewer } from './components/DamageAwareViewer';
import { ReviewQueue } from './components/ReviewQueue';
import { ProvenanceLedger } from './components/ProvenanceLedger';
import { HybridSearch } from './components/HybridSearch';
import { BenchmarkDashboard } from './components/BenchmarkDashboard';
import { TamperDemoModal } from './components/TamperDemoModal';
import { Manuscript, WordItem, LedgerBlock, BenchmarkStage, ConfusionMatrixItem } from './types/manuscript';
import { Search, BarChart2, ShieldAlert, Download, Upload } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'capture' | 'consensus' | 'damage' | 'review' | 'ledger' | 'search' | 'benchmark'
  >('consensus');

  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string>('manuscript-01');
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  // Ledger state
  const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>([]);
  const [isLedgerValid, setIsLedgerValid] = useState<boolean>(true);
  const [brokenBlockIndex, setBrokenBlockIndex] = useState<number>(-1);
  const [failureReason, setFailureReason] = useState<string>('');
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [currentMerkleRoot, setCurrentMerkleRoot] = useState<string>('');
  const [authorityPublicKey, setAuthorityPublicKey] = useState<string>('');

  // Benchmark state
  const [benchmarkStages, setBenchmarkStages] = useState<BenchmarkStage[]>([]);
  const [confusionMatrix, setConfusionMatrix] = useState<ConfusionMatrixItem[]>([]);

  // Modals & Loaders
  const [isTamperModalOpen, setIsTamperModalOpen] = useState<boolean>(false);
  const [isLoadingOCR, setIsLoadingOCR] = useState<boolean>(false);
  const [isRestoringGap, setIsRestoringGap] = useState<boolean>(false);
  const [isSavingCorrection, setIsSavingCorrection] = useState<boolean>(false);

  // Fetch initial data from server
  const fetchAllData = async () => {
    try {
      // 1. Manuscripts
      const msRes = await fetch('/api/manuscripts');
      const msData = await msRes.json();
      if (msData.manuscripts) {
        setManuscripts(msData.manuscripts);
      }

      // 2. Ledger verification
      await refreshLedger();

      // 3. Benchmarks
      const bmRes = await fetch('/api/benchmarks');
      const bmData = await bmRes.json();
      if (bmData.metrics) {
        setBenchmarkStages(bmData.metrics.stages || []);
        setConfusionMatrix(bmData.metrics.confusionMatrixSample || []);
      }
    } catch (err) {
      console.error('Error fetching initial app data:', err);
    }
  };

  const refreshLedger = async () => {
    try {
      const res = await fetch('/api/ledger/verify');
      const data = await res.json();
      setIsLedgerValid(data.isValid);
      setBrokenBlockIndex(data.brokenBlockIndex);
      setFailureReason(data.failureReason || '');
      setIsTampered(data.isTampered);
      setLedgerBlocks(data.blocks || []);
      setCurrentMerkleRoot(data.currentMerkleRoot || '');
      setAuthorityPublicKey(data.authorityPublicKey || '');
    } catch (err) {
      console.error('Error verifying ledger:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const currentDoc = manuscripts.find((m) => m.id === currentDocId) || manuscripts[0] || {
    id: 'manuscript-01',
    title: 'Loading Folio...',
    collection: '',
    script: '',
    material: '',
    dateEstimated: '',
    image: '',
    condition: '',
    provenanceChain: '',
    words: [],
  };

  const toolbarFileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle uploading a brand-new folio image
  const handleUploadNewFolio = (imageDataUrl: string, fileName?: string) => {
    const newDocId = `manuscript-upload-${Date.now()}`;
    const cleanTitle = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Custom User Folio';
    const newManuscript: Manuscript = {
      id: newDocId,
      title: `Folio: ${cleanTitle}`,
      collection: 'User Direct Capture · Private Archival Ingestion',
      script: 'Auto-Detect (Grantha / Devanagari / Sharada)',
      material: 'Uploaded Historical Medium',
      dateEstimated: 'Circa Epigraphical Analysis Pending',
      image: imageDataUrl,
      condition: 'Fresh Upload Ingestion',
      provenanceChain: 'Direct Device Sensor / Camera Capture -> Dharohar Vault',
      words: [],
    };

    setManuscripts((prev) => [newManuscript, ...prev]);
    setCurrentDocId(newDocId);
    return newManuscript;
  };

  // Run live Gemini OCR
  const handleRunLiveGeminiOCR = async (overrideImageData?: string) => {
    setIsLoadingOCR(true);
    try {
      const activeImage = overrideImageData || currentDoc.image;
      const res = await fetch('/api/gemini/consensus-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manuscriptId: currentDoc.id,
          scriptHint: currentDoc.script,
          imageData: activeImage,
        }),
      });
      const data = await res.json();
      if (data.words) {
        setManuscripts((prev) =>
          prev.map((m) =>
            m.id === currentDoc.id
              ? { ...m, words: data.words, image: activeImage }
              : m
          )
        );
      }
      await refreshLedger();
    } catch (err) {
      console.error('Error running live Gemini OCR:', err);
    } finally {
      setIsLoadingOCR(false);
    }
  };

  const handleProceedToOCR = async (processedImageData?: string) => {
    const activeImage = processedImageData || currentDoc.image;
    if (processedImageData) {
      setManuscripts((prev) =>
        prev.map((m) =>
          m.id === currentDoc.id ? { ...m, image: processedImageData } : m
        )
      );
    }
    setActiveTab('consensus');
    await handleRunLiveGeminiOCR(activeImage);
  };

  // AI gap restoration for damaged zones
  const handleTriggerAIRestoration = async (wordId: string) => {
    setIsRestoringGap(true);
    try {
      const targetWord = currentDoc.words.find((w) => w.id === wordId);
      const res = await fetch('/api/gemini/restore-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId,
          manuscriptTitle: currentDoc.title,
          damageDescription: targetWord?.isDamagedGap ? 'Physical folio tear' : 'Faded ink strokes',
          contextWords: currentDoc.words.map((w) => w.consensusText).join(' '),
        }),
      });
      const data = await res.json();
      if (data.suggestedCompletion) {
        setManuscripts((prev) =>
          prev.map((m) => {
            if (m.id !== currentDoc.id) return m;
            return {
              ...m,
              words: m.words.map((w) =>
                w.id === wordId
                  ? {
                      ...w,
                      aiSuggestedCompletion: data.suggestedCompletion,
                      aiCompletionReason: data.reasoning,
                    }
                  : w
              ),
            };
          })
        );
      }
      await refreshLedger();
    } catch (err) {
      console.error('Error triggering AI restoration:', err);
    } finally {
      setIsRestoringGap(false);
    }
  };

  // Save human correction into ground truth
  const handleSaveCorrection = async (
    wordId: string,
    correctedText: string,
    reviewerName: string,
    notes?: string
  ) => {
    setIsSavingCorrection(true);
    try {
      const res = await fetch('/api/ledger/record-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manuscriptId: currentDoc.id,
          wordId,
          correctedText,
          reviewerName,
          reviewerNotes: notes,
        }),
      });
      const data = await res.json();
      if (data.word) {
        setManuscripts((prev) =>
          prev.map((m) => {
            if (m.id !== currentDoc.id) return m;
            return {
              ...m,
              words: m.words.map((w) => (w.id === wordId ? data.word : w)),
            };
          })
        );
      }
      await refreshLedger();
    } catch (err) {
      console.error('Error recording correction:', err);
    } finally {
      setIsSavingCorrection(false);
    }
  };

  // Tamper controls
  const handleTriggerTamper = async () => {
    try {
      await fetch('/api/ledger/tamper', { method: 'POST' });
      await refreshLedger();
      setActiveTab('ledger');
    } catch (err) {
      console.error('Error triggering tamper:', err);
    }
  };

  const handleRestoreTamper = async () => {
    try {
      await fetch('/api/ledger/restore', { method: 'POST' });
      await refreshLedger();
    } catch (err) {
      console.error('Error restoring tamper:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      {/* Primary Top Bar Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTampered={isTampered}
        onOpenTamperDemo={() => setIsTamperModalOpen(true)}
      />

      {/* Global Alarm Strip when Database is Tampered */}
      {isTampered && (
        <div className="bg-rose-700 text-white px-4 py-2 text-xs font-mono flex items-center justify-between shadow-xs sticky top-16 z-40">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-200 animate-spin" />
              LIVE TAMPER ACTIVE: Historical record modified in database! Hash chain at Block #{brokenBlockIndex} is invalidated.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('ledger')}
                className="underline hover:text-rose-100 font-bold"
              >
                Inspect Ledger Proof
              </button>
              <button
                onClick={handleRestoreTamper}
                className="bg-white text-rose-900 px-2.5 py-0.5 rounded font-bold hover:bg-stone-100"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Workspace Toolbar (Operational Utility Bar & Mode Toggles) */}
      <div className="border-b border-stone-200/80 bg-white/70 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Folio Accession metadata */}
          <div className="flex items-center gap-2 text-stone-600">
            <span className="font-semibold text-stone-900">{currentDoc.title}</span>
            <span>·</span>
            <span className="font-mono text-stone-500">{currentDoc.collection}</span>
            <span>·</span>
            <span className="text-stone-500">{currentDoc.script}</span>
          </div>

          {/* Secondary Sub-tools (Upload, Search, Live Benchmark, Export) */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={toolbarFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      handleUploadNewFolio(event.target.result as string, file.name);
                      setActiveTab('capture');
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <button
              onClick={() => toolbarFileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap shrink-0 bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
              title="Upload new manuscript image"
            >
              <Upload className="w-3.5 h-3.5 text-stone-600" />
              Upload Folio
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap shrink-0 ${
                activeTab === 'search'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Hybrid Search
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap shrink-0 ${
                activeTab === 'benchmark'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-600" />
              Live Benchmark (Phase 2)
            </button>
            <a
              href="/api/download-repo"
              download="dharohar-manuscript-archive.zip"
              className="px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap shrink-0 bg-stone-100 hover:bg-stone-200 text-stone-700"
              title="Download entire code repository zip"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              Export Repo (.zip)
            </a>
          </div>
        </div>
      </div>

      {/* Main Viewport Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'capture' && (
          <PreprocessViewer
            currentDoc={currentDoc}
            onProceedToOCR={handleProceedToOCR}
            onSelectDoc={(id) => setCurrentDocId(id)}
            onUploadNewFolio={handleUploadNewFolio}
            allDocs={manuscripts}
          />
        )}

        {activeTab === 'consensus' && (
          <ConsensusViewer
            currentDoc={currentDoc}
            words={currentDoc.words}
            selectedWordId={selectedWordId}
            onSelectWord={(id) => setSelectedWordId(id)}
            onProceedToReview={() => setActiveTab('review')}
            onRunLiveGeminiOCR={() => handleRunLiveGeminiOCR()}
            isLoadingOCR={isLoadingOCR}
          />
        )}

        {activeTab === 'damage' && (
          <DamageAwareViewer
            currentDoc={currentDoc}
            words={currentDoc.words}
            onTriggerAIRestoration={handleTriggerAIRestoration}
            isRestoring={isRestoringGap}
          />
        )}

        {activeTab === 'review' && (
          <ReviewQueue
            currentDoc={currentDoc}
            words={currentDoc.words}
            onSaveCorrection={handleSaveCorrection}
            isSaving={isSavingCorrection}
          />
        )}

        {activeTab === 'ledger' && (
          <ProvenanceLedger
            blocks={ledgerBlocks}
            isValid={isLedgerValid}
            brokenBlockIndex={brokenBlockIndex}
            failureReason={failureReason}
            isTampered={isTampered}
            currentMerkleRoot={currentMerkleRoot}
            authorityPublicKey={authorityPublicKey}
            onTriggerTamper={handleTriggerTamper}
            onRestoreTamper={handleRestoreTamper}
          />
        )}

        {activeTab === 'search' && (
          <HybridSearch
            onSelectManuscript={(id) => {
              setCurrentDocId(id);
              setActiveTab('consensus');
            }}
          />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkDashboard
            stages={benchmarkStages}
            confusionMatrix={confusionMatrix}
          />
        )}
      </main>

      {/* Footer conforming to Museum & Institutional Standards */}
      <footer className="border-t border-stone-200 bg-[#FAF8F5] py-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-cinzel font-bold text-stone-800">DHAROHAR ARCHIVE</span>
            <span>·</span>
            <span>National Manuscript Mission Invariant Architecture</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Ed25519 Cryptographic Proof</span>
            <span>·</span>
            <span>ISO 16363 Conformance</span>
            <span>·</span>
            <span>Gemini 3.8 Flash Vision Arbiter</span>
          </div>
        </div>
      </footer>

      {/* Live Tamper Demo Modal */}
      <TamperDemoModal
        isOpen={isTamperModalOpen}
        onClose={() => setIsTamperModalOpen(false)}
        isTampered={isTampered}
        onTriggerTamper={handleTriggerTamper}
        onRestoreTamper={handleRestoreTamper}
        onViewVerifyPage={() => setActiveTab('ledger')}
      />
    </div>
  );
}
