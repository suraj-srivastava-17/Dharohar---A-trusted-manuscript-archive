export interface WordItem {
  id: string;
  originalText: string;
  consensusText: string;
  tesseractVote: string;
  trocrVote: string;
  geminiVote: string;
  confidence: number; // 0.0 to 1.0
  isDamagedGap: boolean;
  aiSuggestedCompletion?: string;
  aiCompletionReason?: string;
  humanCorrection?: string;
  humanReviewStatus: 'unreviewed' | 'verified' | 'corrected' | 'flagged';
  reviewerName?: string;
  bbox: { ymin: number; xmin: number; ymax: number; xmax: number };
}

export interface Manuscript {
  id: string;
  title: string;
  collection: string;
  script: string;
  material: string;
  dateEstimated: string;
  image: string;
  condition: string;
  provenanceChain: string;
  words: WordItem[];
}

export interface LedgerBlock {
  index: number;
  timestamp: string;
  eventType: 'GENESIS' | 'INGESTION' | 'PREPROCESSING' | 'CONSENSUS_OCR' | 'DAMAGE_ANALYSIS' | 'HUMAN_CORRECTION';
  documentId: string;
  documentTitle: string;
  payload: any;
  payloadHash: string;
  prevHash: string;
  blockHash: string;
  merkleRoot: string;
  signedBy: string;
  signature: string;
}

export interface BenchmarkStage {
  stageName: string;
  cer: number;
  wer: number;
  speedMs: number | string;
  description: string;
  color: string;
}

export interface ConfusionMatrixItem {
  charTrue: string;
  charPred: string;
  freq: number;
  resolvedByConsensus: boolean;
}
