# SusBase: The Crowd-Sourced Link Verification Layer

**Tagline:** Make Internet Safer.
**Mission:** Create a massive, open database of malicious links and social engineering traps, powered by crowd intelligence and smart algorithms.

## 1. Core User Flows

### A. The "Check" Flow (Public)
1.  **Landing:** User sees a massive, minimalist search bar (inspired by *Have I Been Pwned*).
2.  **Input:** User pastes a link (e.g., `guthib.com`).
3.  **Process:**
    * **Step 1 (DB):** Check Supabase for existing reports/verifications.
    * **Step 2 (Smart Algo):** If unknown, run the **"SusEngine"** (Typosquatting + Keyword analysis).
4.  **Result:** Display "Safe", "Suspicious", or "Malicious" with a trust score and specific red flags (e.g., "Impersonates GitHub").

### B. The "Report" Flow (Streamlined UX)
1.  **Trigger:** User clicks "Report this Link" or uses the Web Extension.
2.  **State Check:**
    * **If Logged In:** Submission is sent immediately to the server.
    * **If Guest:**
        1.  Store the submission details in local storage/session.
        2.  Prompt "Sign in to count your vote" (Google/GitHub only).
        3.  **Post-Auth:** Automatically retrieve the submission and send it.
3.  **Reward:** User gains "Hunter Points" on the Leaderboard.

## 2. Technical Stack

### Infrastructure & Backend
* **Framework:** Next.js 15 (App Router).
* **Database:** Supabase (PostgreSQL).
* **Admin CMS:** PayloadCMS (v3, Beta/Latest) mounted at `/admin` or separate service.
    * *Role:* Manages the "URLs" collection, verifies reports, manages "High Value Targets" whitelist.
* **Auth:** Supabase Auth.
    * *Providers:* Google, GitHub (Strictly no email/password signup to reduce bot spam).
* **Email:** Resend (for critical notifications, if any).
* **Deployment:** Vercel.

### Frontend & Design
* **Font:** JetBrains Mono (Global).
* **Icons:** HugeIcons.
* **UI Library:** Tailwind CSS + Shadcn UI.
* **Theme:** "Lyra" / Minimalist Monospace (High contrast, "Terminal-lite" aesthetic).
* **Accessibility:** WCAG 2.1 AA compliant.
* **Responsive Design:** Mobile-first approach with breakpoints for tablets and desktops.
* **Performance:** Optimized for fast load times and smooth interactions.
* **SEO:** SEO-friendly meta tags, structured data, and optimized images.
* **Analytics:** Google Analytics for tracking user behavior and performance metrics.

### Deployment & Hosting
* **Hosting:** Vercel.
* **CDN:** Cloudflare.

### Development Tools
* **Biome:**
    * *Formatter:* Biome Formatter.
    * *Linter:* Biome Linter.
    * *Type Checker:* Biome Type Checker.

## 3. The "Smart Algorithm" (SusEngine)
Located in `src/lib/engine`. It performs purely logic-based checks before human verification.

1.  **Typosquatting Detection:**
    * Calculates **Levenshtein Distance** between the input domain and a `TargetWhitelist` (e.g., `google.com`, `bca.co.id`, `binance.com`).
    * *Example:* `goog1e.com` vs `google.com` -> Distance 1 -> **High Risk**.
2.  **Keyword Heuristics:**
    * Scans URL string for social engineering keywords: `login`, `verify`, `secure`, `update-payment`, `account-locked`.
3.  **TLD Risk:**
    * Flags high-risk TLDs often used for spam (`.xyz`, `.top`, `.gq`) if combined with brand names.

## 4. Data Models (PayloadCMS/Supabase)

### Collection: `URLs`
* `url` (Text, Unique, Index)
* `domain` (Text, extracted from URL)
* `status` (Select: `SAFE`, `SUSPICIOUS`, `MALICIOUS`, `UNKNOWN`)
* `trust_score` (Number: 0-100)
* `reports_count` (Number)
* `flags` (Array: "typosquatting", "credential_harvesting", "user_reported")
* `redirect_chain` (JSON: stores the path if it redirects)

### Collection: `Reports`
* `url_id` (Relation to URLs)
* `reporter_id` (Relation to Users)
* `comment` (Text)
* `screenshot` (Media, optional)

### Collection: `HighValueTargets` (The "Real" List)
* `name` (e.g., "GitHub")
* `official_domain` (e.g., "github.com")
* `variations` (Array: known safe subdomains)

## 5. Implementation Phases

### Phase 1: Foundation
* Setup Next.js with JetBrains Mono & Tailwind.
* Configure Supabase project.
* Install PayloadCMS and connect to Supabase Postgres.
* Setup Auth (Google/GitHub).

### Phase 2: The Engine & Submission
* Build `SusEngine` logic (Typosquat check).
* Create the "Submit -> Auth -> Save" flow in Next.js.
* Build the Admin Dashboard in Payload to view incoming `URLs`.

### Phase 3: Public UI
* Build the "Have I Been Pwned" style Landing Page.
* Build the Result Page with risk visualization.
* Build the Leaderboard.
* Use @tabler/icons-react for icons.
* Add theme toggle to implement theme switching functionality.

### Phase 4: Extension & API
* Create a simple Chrome Extension that sends current tab URL to `/api/check`.
* Open public API for wrappers.
