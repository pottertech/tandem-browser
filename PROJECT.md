# Tandem Browser 🧠🤝👤

> "Kees en Robin zijn één entiteit" — De browser waar AI en mens samen het internet op gaan.

## Missie

Een browser gebouwd voor **mens-AI symbiose**. Niet een headless scraper, niet een bot — een echte browser waar Robin (mens) en Kees (AI) samen doorheen navigeren. Robin is de copiloot die door detectie-gates loodst, Kees is de motor die data verwerkt, navigeert, en acties uitvoert.

## Waarom dit bestaat

1. **Platforms schermen zich af** — LinkedIn, X, zelfs gewone sites blokkeren AI crawlers
2. **AI zonder ogen is blind** — Kees kan geen actuele informatie zien zonder browser
3. **Samen door de muur** — Een echte browser met een echt mens erachter passeert elke detectie
4. **Data ownership** — Geen betaalde API's van derden, eigen toegang tot het open web

## Architectuur

```
┌─────────────────────────────────────────────────────────┐
│  Tandem Browser (Electron)                             │
│                                                         │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │  Browser UI   │  │  Kees Control Panel             │ │
│  │  (Chromium)   │  │  - Command queue                │ │
│  │               │◄─┤  - Status dashboard             │ │
│  │  Robin ziet   │  │  - Page analysis                │ │
│  │  & navigeert  │  │  - Action log                   │ │
│  └──────────────┘  └─────────────────────────────────┘ │
│         │                        │                      │
│         ▼                        ▼                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tandem API (localhost:8765)                     │  │
│  │                                                   │  │
│  │  /navigate    /click    /type    /screenshot      │  │
│  │  /extract     /cookies  /status  /page-content    │  │
│  │  /execute-js  /wait     /scroll  /copilot-alert   │  │
│  └──────────────────────────────────────────────────┘  │
│         │                        │                      │
│         ▼                        ▼                      │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │  Anti-Detect  │  │  OpenClaw Integration           │ │
│  │  Layer        │  │                                 │ │
│  │  - Real UA    │  │  Kees (via exec/fetch) stuurt   │ │
│  │  - Fingerprint│  │  commando's naar de API         │ │
│  │  - Timing     │  │  en leest pagina content        │ │
│  │  - Cookies    │  │                                 │ │
│  └──────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Core Principes

1. **Echte browser** — Niet headless, niet Puppeteer. Een browser die Robin ook gewoon kan gebruiken.
2. **API-first** — Alles wat Kees kan doen gaat via de HTTP API op localhost.
3. **Copilot alerts** — Als er een captcha, login, of detectie is → Robin krijgt een notificatie.
4. **Stealth by default** — Fingerprint randomisatie, realistic timing, persistent sessies.
5. **Geen cloud** — Alles lokaal. Geen data die het netwerk verlaat (behalve naar de websites zelf).

## Features (MVP — Week 1)

### Must Have
- [ ] Electron browser met tabs en navigatie
- [ ] HTTP API op localhost:8765
- [ ] `/navigate` — URL openen
- [ ] `/page-content` — Volledige pagina als markdown/text teruggeven
- [ ] `/click` — Element klikken (CSS selector)
- [ ] `/type` — Tekst typen in velden
- [ ] `/screenshot` — Screenshot maken en opslaan
- [ ] `/execute-js` — JavaScript uitvoeren op de pagina
- [ ] `/cookies` — Cookies lezen/zetten
- [ ] `/status` — Huidige URL, titel, laadstatus
- [ ] Anti-detect: realistic UA, geen headless flags
- [ ] Persistent sessions (cookies overleven restart)
- [ ] Copilot alert systeem (notification naar Robin)

### Nice to Have (Week 2+)
- [ ] Tab management via API
- [ ] Form auto-fill met opgeslagen profielen
- [ ] Proxy support
- [ ] Request interception (headers wijzigen)
- [ ] Fingerprint spoofing (canvas, WebGL, fonts)
- [ ] OpenClaw skill/tool integratie
- [ ] Recording/replay van sessies
- [ ] Multi-profile support

## Tech Stack

- **Runtime:** Electron (latest)
- **Language:** TypeScript
- **API:** Express.js (localhost:8765)
- **Anti-detect:** Custom stealth layer
- **Build:** esbuild of tsc
- **Package:** electron-builder

## Hoe Kees het gebruikt (via OpenClaw)

```bash
# Navigeer naar een pagina
curl http://localhost:8765/navigate -d '{"url":"https://linkedin.com/in/robinwaslander"}'

# Lees de content
curl http://localhost:8765/page-content

# Klik op een element
curl http://localhost:8765/click -d '{"selector":"button.follow"}'

# Screenshot voor visuele analyse
curl http://localhost:8765/screenshot
```

In OpenClaw kan Kees dit aanroepen via `exec`:
```
exec: curl -s http://localhost:8765/page-content | head -100
```

## Hoe Robin het gebruikt

Gewoon als browser. Open het, browse, doe je ding. Als Kees iets nodig heeft verschijnt er een subtiel paneel met wat hij wil doen. Robin keurt goed of neemt over.

## Oorsprong

Herbouwd vanuit `totalrecall-browserV2` — Robin's eerdere custom browser die al VSCode extensions in de browser kon draaien en Claude CLI integratie had. De DNA is hetzelfde, de focus is verschoven van "dev tool" naar "centaur browsing tool".

## Naam

**Centaur** — half mens, half AI. Samen sterker dan apart. Net als het schaakconcept waar een mens+AI team sterker is dan de beste AI of de beste mens alleen.
