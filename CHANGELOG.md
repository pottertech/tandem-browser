# Changelog

## [Unreleased] — 2026-02-11

### 🧠 Phase 3.1 — Site Memory
- New `SiteMemoryManager` class (`src/memory/site-memory.ts`)
- Auto-extract page data on every visit: title, URL, meta description, headings, forms/links count, text preview (500 chars)
- Storage in `~/.tandem/site-memory/{domain}.json` — max 100 visits, 50 diffs per domain
- Diff detection: compares with previous visit, tracks new/removed headings, title/description changes, link/form count deltas
- Visit time tracking: records total time spent per domain
- API endpoints: `GET /memory/sites`, `GET /memory/site/:domain`, `GET /memory/site/:domain/diff`, `GET /memory/search?q=...`
- Full-text search across all site memories

### 👁️ Phase 3.2 — Scheduled Watches
- New `WatchManager` class (`src/watch/watcher.ts`)
- Background page monitoring via hidden BrowserWindow with stealth patches
- SHA-256 hash-based change detection on page text content
- macOS notification + copilot alert when changes detected
- Persistent watch list in `~/.tandem/watches.json` (survives restart)
- Max 20 watches to prevent overload
- API endpoints: `POST /watch/add`, `GET /watch/list`, `DELETE /watch/remove`, `POST /watch/check`

### 🕶️ Phase 3.3 — Headless Mode
- New `HeadlessManager` class (`src/headless/manager.ts`)
- Hidden BrowserWindow (show: false) for Kees to browse independently
- Same `persist:tandem` partition (shared cookies) + same stealth patches
- Captcha detection: checks for reCAPTCHA, hCaptcha, Cloudflare challenge selectors every 3s
- Auto-show + copilot alert on: captcha detected, login redirect, page crash
- API endpoints: `POST /headless/open`, `GET /headless/content`, `GET /headless/status`, `POST /headless/show`, `POST /headless/hide`, `POST /headless/close`

### ⚙️ Phase 2.8 — Settings/Config Scherm
- New `ConfigManager` class (`src/config/manager.ts`) — manages `~/.tandem/config.json`
- Settings page (`shell/settings.html`) with dark theme matching Tandem
- 6 settings sections: Algemeen, Screenshots, Voice, Stealth, Behavioral Learning, Data
- API endpoints: `GET /config`, `PATCH /config` (partial update, deep merge)
- API endpoints: `POST /behavior/clear`, `GET /data/export`, `POST /data/import`, `POST /data/wipe`
- Navigate to settings via `tandem://settings` in URL bar
- Keyboard shortcut: `Cmd+,` opens settings (macOS standard)
- Kees badge: right-click or long-press opens settings
- Live save on every change — no restart needed
- Confirmation modal for destructive actions (wipe data, clear behavior)
- Behavior stats displayed with auto-refresh (events today, session, avg keypress/click timing)
- Sticky navigation sidebar with scroll-aware highlighting

### 📸 Phase 2.7 — Screenshot Pipeline Voltooien
- Screenshot thumbnails in Kees paneel zijn nu clickable (opent full-size viewer in popup)
- Cmd+Shift+S quick screenshot werkt zonder draw mode (verified)
- Volledige pipeline: clipboard + ~/Pictures/Tandem/ + base64 panel preview

### 🧀 Phase 2.9 — Custom New Tab (Kees.ai)
- Nieuwe `shell/newtab.html` — custom new tab pagina
- Donker thema matching Tandem, centered layout met Tandem logo + 🧀
- Grote zoekbalk: submit → DuckDuckGo of directe URL navigatie
- Quick links: LinkedIn, GitHub, Kanbu, ClaroNote, DuckDuckGo, Gmail, YouTube, Reddit (met favicons)
- Recente tabs sectie (haalt data op van /tabs/list API)
- Kees chat widget rechtsonder (collapsible, met message polling)
- Nieuwe tabs laden newtab.html i.p.v. DuckDuckGo
- URL bar automatisch leeg bij new tab pagina's

### 🛡️ Bonus — Electron Fingerprint Hardening
- Complete `window.chrome` mock (runtime, loadTimes, csi, app met alle sub-objects)
- Verwijder Electron giveaways: window.process, require, module, exports, Buffer, __dirname, __filename
- `navigator.userAgentData` mock matching Chrome 131 (inclusief getHighEntropyValues)
- Verbeterde stealth voor bot-detectie tests (sannysoft, creepjs)

### 🐛 Bugfixes
- **Voice input**: Auto-restart recognition after `onend` event so continuous listening works 10s+
- **Voice UI**: Larger pulsating indicator (16px dot), "Spreek nu..." text, prominent styling
- **Screenshot without draw mode**: `Cmd+Shift+S` or toolbar 📸 button captures webview directly (no draw overlay needed), saves to clipboard + ~/Pictures/Tandem/
- **Chat auto-refresh**: Polls API every 2 seconds for new messages; messages sent via `POST /chat` appear instantly in Robin's panel
- **Chat auto-scroll**: Always scrolls to newest message

### 💬 Phase 2.6 — Kees Chat Koppeling
- Chat history persistent in `~/.tandem/chat-history.json` (survives app restart)
- Each message has timestamp + from (robin/kees)
- Chat UI: Robin messages right-aligned (green), Kees messages left-aligned (accent color)
- Timestamps shown on each message
- Typing indicator when Kees "thinks" — `POST /chat/typing` API endpoint
- `GET /chat?since_id=N` for efficient polling

### 🧬 Phase 2.8 — Behavioral Learning (Observation Layer)
- New `BehaviorObserver` class in main process (passive, no performance impact)
- Tracks: mouse clicks (position + timestamp), scroll events, keyboard timing (interval between keystrokes), navigation events, tab switches
- Raw data stored in `~/.tandem/behavior/raw/{date}.jsonl` (append-only, one event per line)
- `GET /behavior/stats` API endpoint with basic statistics (total events, avg click delay, avg keypress interval, etc.)
