import React, { useState } from 'react';
import { Search, Sparkles, BookOpen, ArrowRight, Languages } from 'lucide-react';
import { Manuscript } from '../types/manuscript';

interface SearchResultItem {
  manuscript: Manuscript;
  relevanceScore: number;
  matchedTerms: string[];
}

interface HybridSearchProps {
  onSelectManuscript: (docId: string) => void;
}

export const HybridSearch: React.FC<HybridSearchProps> = ({ onSelectManuscript }) => {
  const [query, setQuery] = useState<string>('prayer for universal peace and freedom from illness');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchData, setSearchData] = useState<{
    searchAnalysis: any;
    results: SearchResultItem[];
  } | null>(null);

  const handleSearch = async (searchQ: string) => {
    if (!searchQ.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQ }),
      });
      const data = await res.json();
      setSearchData(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial search
  React.useEffect(() => {
    handleSearch(query);
  }, []);

  const sampleQueries = [
    'prayer for universal peace and health',
    'herbal decoction and medicine for diseases',
    'salutations to Shiva and supreme teacher',
    'सर्वे भवन्तु सुखिनः',
  ];

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="border-b border-stone-200 pb-5">
        <span className="text-xs uppercase tracking-widest text-stone-500 font-sans block mb-1">
          Module 06 · Multilingual Retrieval
        </span>
        <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
          Hybrid Semantic & Keyword Search
        </h1>
        <p className="text-sm text-stone-600 mt-1 max-w-2xl font-manuscript text-lg">
          Query the archive in English, modern Hindi, or classical Sanskrit. Gemini 3.8 Flash translates semantic intent and matches against vectorized manuscript inscriptions.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search concepts e.g. 'remedy for cough', 'salutations to guru', 'सर्वे सुखिनः'..."
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-300 rounded-md focus:outline-hidden focus:border-stone-900 text-stone-900 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isLoading ? 'Vector Searching...' : 'Semantic Search'}
          </button>
        </form>

        {/* Quick Sample Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-500">
          <span className="text-stone-400">Try prompts:</span>
          {sampleQueries.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuery(q);
                handleSearch(q);
              }}
              className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors text-[11px]"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Semantic Intent & Cross-Lingual Decomposition */}
      {searchData?.searchAnalysis && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-950 font-semibold">
            <Languages className="w-4 h-4 text-amber-800" />
            <span>Gemini Cross-Lingual Semantic Expansion</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-2.5 bg-white rounded border border-amber-200">
              <span className="text-[10px] text-stone-500 uppercase font-mono block">Sanskrit Match Terms</span>
              <span className="font-manuscript text-base font-bold text-amber-950 block mt-0.5">
                {searchData.searchAnalysis.sanskritTransliteration}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded border border-amber-200">
              <span className="text-[10px] text-stone-500 uppercase font-mono block">Hindi Conceptual Translation</span>
              <span className="font-sans text-xs font-medium text-stone-900 block mt-0.5">
                {searchData.searchAnalysis.hindiTranslation}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded border border-amber-200">
              <span className="text-[10px] text-stone-500 uppercase font-mono block">Philosophical Domain Tags</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {searchData.searchAnalysis.conceptualTags?.map((tag: string, idx: number) => (
                  <span key={idx} className="text-[10px] font-mono text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
          Ranked Manuscript Matches
        </h2>

        {searchData?.results?.map((res, idx) => (
          <div
            key={res.manuscript.id}
            className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs hover:border-stone-400 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <img
                  src={res.manuscript.image}
                  alt={res.manuscript.title}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 object-cover rounded-lg border border-stone-200 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-stone-500">
                      #{idx + 1}
                    </span>
                    <h3 className="font-cinzel text-base font-bold text-stone-900">
                      {res.manuscript.title}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {res.manuscript.collection} · {res.manuscript.material} · {res.manuscript.dateEstimated}
                  </p>
                  <p className="text-xs text-stone-500 mt-1 italic">
                    Provenance: {res.manuscript.provenanceChain}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-stone-500 block">Relevance</span>
                <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                  {res.relevanceScore}%
                </span>
              </div>
            </div>

            {/* Inscription preview snippet */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1 text-xs">
              <span className="font-semibold text-stone-700 block">Consensus Inscription Words:</span>
              <div className="flex flex-wrap gap-1 font-manuscript text-lg text-stone-900">
                {res.manuscript.words.map((w) => (
                  <span
                    key={w.id}
                    className={`px-1 rounded ${
                      res.matchedTerms.includes(w.consensusText) || res.matchedTerms.includes(w.humanCorrection || '')
                        ? 'bg-amber-200 text-stone-950 font-bold'
                        : ''
                    }`}
                  >
                    {w.humanCorrection || w.consensusText}
                  </span>
                ))}
              </div>
            </div>

            {/* Jump to Folio action */}
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={() => onSelectManuscript(res.manuscript.id)}
                className="px-4 py-2 text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-stone-700" />
                Inspect Folio in Consensus OCR
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
