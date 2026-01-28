# SusBase: The Crowd-Sourced Link Safety Layer
**Tagline:** Make Internet Safer.

## 1. Vision
SusBase is an open-source, crowd-powered database for verifying links. Unlike traditional scanners that check for malware signatures, SusBase focuses on **Social Engineering** and **Homograph Attacks** (e.g., `verceI.com` vs `vercel.com`). It serves as a public API and frontend for reporting and verifying URL safety.

## 2. Technical Stack
- **Framework:** Next.js (App Router, Server Components).
- **Language:** TypeScript (Strict).
- **Database:** SurrealDB (Multi-model: Graph + Document).
  - *Why?* We need to map relationships: `Domain` -> `redirects_to` -> `IP` -> `ReportedBy`.
- **Styling:** Tailwind CSS + Shadcn UI.
- **State/Fetching:** TanStack Query (optional, server actions preferred for mutations).
- **Environment:** Node 20+, Docker (for self-hosting SurrealDB).

## 3. Core Modules

### A. The Homoglyph Engine (`/lib/scanner`)
This is the core differentiator. It does not just check a blacklist.
1.  **Normalization:** Convert Punycode to Unicode.
2.  **Similarity Check:** Calculate Levenshtein Distance against a `HighValueTargets` list (e.g., banks, crypto exchanges, major tech).
3.  **Heuristics:** Detect excessive subdomains, mixed scripts (Cyrillic + Latin), and IP-only hosts.

### B. The Trust Graph (SurrealDB Schema)
We treat data as a graph.
- **Nodes:** `User`, `Url`, `Domain`, `ScanEvent`.
- **Edges:** `REPORTED`, `REDIRECTS_TO`, `HOSTED_ON`.
- **Logic:** If a trusted `User` reports a `Url`, the trust score of the `Domain` decreases.

### C. The API (`/app/api/...`)
- `POST /api/scan`: Public endpoint to check a URL. Returns a JSON `risk_score` (0-100) and `flags` (e.g., ["typosquatting", "user_reported"]).
- `POST /api/report`: Authenticated endpoint to report a URL.

### D. The Frontend (`/app`)
- **Landing:** Big search bar ("Is this link sus?").
- **Result Page:** Safety score, breakdown of why it's flagged, and screenshot (placeholder for now).
- **Leaderboard:** Gamification for top reporters ("Hunters").

## 4. Implementation Phase 1 (MVP)
1.  **Setup:** Initialize Next.js + Tailwind + Shadcn. Configure SurrealDB Docker compose.
2.  **Schema:** Write `.surql` files for `url`, `report`, and `user` tables.
3.  **Scanner Logic:** Implement `detectHomoglyph(inputUrl, targetUrl)` utility.
4.  **UI:** Build the Landing Page and Report Form.
5.  **API:** Wire up the `check` endpoint to return mock data + actual homoglyph check results.

## 5. Development Rules
- **No Over-Engineering:** Do not build a massive crawler. Check on-demand.
- **Performance:** Cache scan results in DB. Do not re-scan the same URL within 1 hour.
- **Security:** Sanitize all inputs. The database will contain malicious links; handle them as text, never render them as active HTML links without `rel="nofollow noreferrer"`.

## 6. Future Scope (Post-MVP)
- Browser Extension (manifest v3).
- OCR Scanner for checking links inside images (QR Codes).
