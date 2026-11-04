# Dharohar (धरोहर) · A Trusted Manuscript Archive

> Every word in a digitised manuscript should carry a confidence score, be verifiable by a human expert, and have a tamper-evident history.

**Track:** Culture & Digital Heritage · **Stack:** React 19, Vite, Tailwind, Express, TypeScript, Gemini API

---

## 1. The Problem

India holds millions of manuscripts in Brahmi, Grantha, Sharada, Devanagari and other scripts. Digitising them runs into three problems:

1. **OCR struggles on historical media.** Uneven lighting, faded ink, palm-leaf grain and insect damage break standard OCR.
2. **AI can invent text.** A model that "completes" a damaged line can silently corrupt a scholarly record.
3. **Records can be altered quietly.** Without an audit trail, a contested reading cannot be defended.

## 2. What Dharohar Does

Dharohar is a web application that walks a folio through a verifiable pipeline:

| # | Module | What it does | Status |
|---|---|---|---|
| 1 | **Capture & Restore** | Upload a folio image and clean it with in-browser canvas filters: lighting correction, denoise, binarisation, deskew. | Working (client-side) |
| 2 | **Consensus OCR** | Shows per-word readings from several engines with an agreement-based confidence score. | Gemini vision is live. Tesseract/TrOCR are currently **simulated placeholders** (see §7). |
| 3 | **Damage-Aware View** | Marks physically missing text as `[UNREADABLE_GAP]`. AI restorations are kept in a separate layer with a stated justification, never mixed into the original text. | Working (Gemini, with preset fallback) |
| 4 | **Human Review Queue** | An expert inspects a word under a magnifier, accepts an engine's reading or types a correction. Corrections are stored as a separate ground-truth layer. | Working |
| 5 | **Provenance Ledger** | Every lifecycle event becomes a block in a SHA-256 hash chain, signed with Ed25519, with a Merkle root over the blocks. A Verify view re-checks the whole chain. | Working (in-memory) |
| 6 | **Hybrid Search** | Search across English, Hindi and Sanskrit (Devanagari/IAST); Gemini analyses the query, with keyword matching over the archive. | Working (Gemini, with keyword fallback) |

Also included: a **Benchmark dashboard** (illustrative targets, see §7) and a **Tamper demo** that simulates a direct database edit and shows the ledger detecting it.

## 3. Architecture

```text
[ Browser · React + Vite SPA ]
        │   fetch /api/*
        ▼
[ Express + TypeScript server (server.ts) ]
        │
        ├── Manuscript store ......... in-memory, seeded with 3 sample folios
        │                              (palm-leaf, birch-bark, paper)
        ├── OCR consensus ............ POST /api/gemini/consensus-ocr
        │      ├─ Gemini vision (live, needs GEMINI_API_KEY)
        │      └─ Tesseract / TrOCR votes (placeholder fields, see §7)
        ├── Gap restoration .......... POST /api/gemini/restore-gap
        ├── Search ................... POST /api/gemini/search
        └── Provenance ledger ........ SHA-256 chain + Ed25519 signatures
               ├─ record-correction (append block)
               ├─ verify (recompute payload hash, chain link, signature)
               └─ tamper / restore (demo controls)
```

The server runs Vite in middleware mode during development, so one process serves both the UI and the API on port 3000.

### Provenance ledger block

Each block has this shape (`src/types/manuscript.ts`):

| Field | Meaning |
|---|---|
| `index` | Position in the chain |
| `timestamp` | ISO time of the event |
| `eventType` | `GENESIS`, `INGESTION`, `PREPROCESSING`, `CONSENSUS_OCR`, `DAMAGE_ANALYSIS` or `HUMAN_CORRECTION` |
| `documentId`, `documentTitle` | The manuscript the event belongs to |
| `payload` | Event details (JSON) |
| `payloadHash` | `SHA-256(JSON(payload))` |
| `prevHash` | `blockHash` of the previous block |
| `blockHash` | `SHA-256(index \| timestamp \| eventType \| documentId \| payloadHash \| prevHash)` |
| `merkleRoot` | Merkle root computed over the block's hashes |
| `signature` | Ed25519 signature of `blockHash` by the archive authority key |

**Verification** recomputes the payload hash, checks `prevHash` against the previous block, and verifies the signature. The first failure is reported with its block number.

### Word record (the OCR layer)

`originalText`, `consensusText`, `tesseractVote`, `trocrVote`, `geminiVote`, `confidence` (0–1), `isDamagedGap`, `aiSuggestedCompletion`, `aiCompletionReason`, `humanCorrection`, `humanReviewStatus` (`unreviewed | verified | corrected | flagged`), `reviewerName`, `bbox` (normalised 0–1000).

Raw OCR output, AI suggestions and human corrections live in **separate fields**, so a correction never overwrites what the machine originally read.

## 4. API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Server status, number of manuscripts, ledger height, tamper flag |
| GET | `/api/manuscripts` | All manuscripts with their word records |
| POST | `/api/gemini/consensus-ocr` | Run OCR on a folio image and return word-level consensus |
| POST | `/api/gemini/restore-gap` | Philological suggestion for a damaged gap (kept as a separate layer) |
| POST | `/api/gemini/search` | Multilingual query analysis plus archive search |
| POST | `/api/ledger/record-correction` | Save a human correction and append a signed block |
| GET | `/api/ledger/verify` | Verify the whole chain; returns validity, broken block, Merkle root, public key |
| POST | `/api/ledger/tamper` | Demo only: simulate a database edit |
| POST | `/api/ledger/restore` | Demo only: undo the simulated edit |
| GET | `/api/benchmarks` | Illustrative benchmark figures (see §7) |

## 5. Setup

**Requirements:** Node.js 20+, npm 9+. A Gemini API key is optional.

```bash
git clone https://github.com/suraj-srivastava-17/Dharohar---A-trusted-manuscript-archive.git
cd Dharohar---A-trusted-manuscript-archive

npm install
cp .env.example .env          # add GEMINI_API_KEY inside .env (optional)
npm run dev                   # http://localhost:3000
```

Without a Gemini key the app still runs. OCR, gap restoration and search then return built-in sample results, so uploaded images are **not** analysed in that mode.

**Production build**

```bash
npm run build                                 # builds the frontend to dist/
NODE_ENV=production npx tsx server.ts         # serves dist/ and the API
```

**Type-check:** `npm run lint`

## 6. Demo Walkthrough

1. Open the **Consensus OCR** tab: a palm-leaf folio with per-word votes and confidence.
2. Open **Damage**: see `[UNREADABLE_GAP]` and a separate AI suggestion with its reasoning.
3. Open **Review**: correct a word. A `HUMAN_CORRECTION` block is appended to the ledger.
4. Open **Ledger**: the chain shows as valid, with its Merkle root and public key.
5. Press **Tamper**: the ledger turns red and points to the exact block whose hash no longer matches.
6. Press **Restore**: the ledger verifies again.

## 7. Limitations (read before judging)

We would rather state these than have them found:

- **Only Gemini performs real OCR.** The Tesseract and TrOCR columns are placeholder values in the data model. Integrating real engines is the first item on the roadmap. The "consensus" score is therefore an agreement calculation over placeholder votes plus the live Gemini reading.
- **Benchmark figures are illustrative.** The CER/WER values on the dashboard (for example 18.4% → 0.4%) are fixed numbers served by `/api/benchmarks`. They are **not** measured results from a test run.
- **The ledger is in memory.** It resets when the server restarts, and the signing key is regenerated each time. The chain and verification logic is real; persistence is not yet implemented.
- **The tamper demo is a simulation.** It changes the displayed payload of one block without re-hashing, to show how detection works. It does not edit a real database.
- **Image filters run in the browser** on canvas, not on a server-side pipeline.
- **Authentication is not implemented.** The reviewer name is free text.

## 8. Roadmap

1. Run real Tesseract (and a Sanskrit/Devanagari-capable model) behind the same consensus interface.
2. Persist manuscripts and the ledger in a database (PostgreSQL or SQLite) with a stable archive signing key.
3. Measure CER/WER on a real, labelled folio set and replace the illustrative benchmark.
4. Reviewer accounts and role-based access.
5. Anchor the daily Merkle root to an external, public timestamp.

## 9. Project Structure

```text
server.ts                 Express API, ledger, crypto, Gemini calls
src/App.tsx               Tabs and application state
src/components/           PreprocessViewer, ConsensusViewer, DamageAwareViewer,
                          ReviewQueue, ProvenanceLedger, HybridSearch,
                          BenchmarkDashboard, TamperDemoModal, Navbar
src/types/manuscript.ts   Shared types
src/assets/images/        Sample folio images
```

## 10. License

Apache-2.0
