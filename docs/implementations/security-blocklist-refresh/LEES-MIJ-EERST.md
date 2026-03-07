# Security Blocklist Refresh — START HERE

> **Date:** 2026-03-07
> **Status:** Ready
> **Goal:** Make Tandem's blocklist pipeline faster at startup, broader in feed support, and safer to update in the background without freezing the browser
> **Order:** Phase 1 → 2 → 3 → 4

---

## Why This Track Exists

Tandem's current `NetworkShield` is effective, but it still assumes a small set
of text-based feeds loaded synchronously into memory. That works for the current
three blocklists, but it does not scale well to modern threat intel formats,
larger curated feeds, or more frequent updates.

This track keeps security in the browser core while explicitly keeping consumer
ad blocking out of scope. Phishing, malware, and known bad infrastructure belong
in the core security pipeline. EasyList-style ad blocking does not.

---

## Architecture In 30 Seconds

```text
Startup
  -> SecurityDB blocklist + cached critical snapshot
  -> NetworkShield becomes usable immediately
  -> UI is ready
  -> background hydrate loads larger cached feeds
  -> background updater refreshes stale sources
  -> atomic swap replaces active in-memory sets
```

The browser should start fast, then improve its threat coverage while Robin is
already browsing.

---

## Project Structure — Relevant Files

> Read only the files listed by the active phase document.

### Read For All Phases

| File | Why |
|------|-----|
| `AGENTS.md` | workflow rules, anti-detection constraints, commit/report expectations |
| `PROJECT.md` | product/security positioning |
| `src/main.ts` | app lifecycle and manager wiring |
| `src/security/security-manager.ts` | blocklist scheduler ownership |
| `src/security/network-shield.ts` | in-memory blocklist lifecycle and request checks |
| `src/security/blocklists/updater.ts` | feed downloads, parsing, and reload flow |

### Additional Files Per Phase

See the active `fase-*.md` document.

---

## Hard Rules For This Track

1. **No ad blocker scope creep**: do not add EasyList, EasyPrivacy, cosmetic
   filtering, or consumer annoyance blocking to the browser core
2. **Fast startup wins**: no large synchronous blocklist parse on the critical
   startup path after this track is complete
3. **Atomic updates only**: never expose a partially loaded in-memory blocklist
   to live request decisions
4. **High-signal feeds first**: prioritize phishing, malware, and C2 feeds over
   giant tracker/ad lists
5. **Function names over line numbers**: always refer to concrete
   functions/classes

---

## In Scope

- parser support for structured feeds (`json`, `csv`)
- per-source metadata and scheduling
- cached startup snapshots for fast boot
- async/incremental background hydration
- curated security feed expansion for threat intel

## Explicitly Out Of Scope

- EasyList / EasyPrivacy / OISD as browser-core blocking
- cosmetic filtering
- DOM ad removal
- content-script ad blocking
- broad "block more stuff" behavior that mixes ads and security

---

## Document Set

| File | Purpose | Status |
|------|---------|--------|
| `LEES-MIJ-EERST.md` | execution guide for the full track | Ready |
| `fase-1-parser-foundation.md` | parser abstraction + source manifest | Ready |
| `fase-2-fast-start-hydration.md` | cached startup snapshot + atomic swap | Planned |
| `fase-3-tiered-update-scheduler.md` | source freshness tiers + async update policy | Planned |
| `fase-4-core-feed-expansion.md` | add curated JSON/CSV threat feeds | Planned |

---

## Design Decisions Already Made

- `NetworkShield` remains a security component, not an ad blocker
- existing domain and URL checks remain the core lookup path
- SecurityDB remains the durable source of blocklist metadata and dynamic
  entries
- startup should trust existing reputation/trust systems first, then improve
  blocklist coverage in the background

---

## Proposed Feed Strategy

### Startup-critical

- SecurityDB dynamic blocklist entries
- cached last-known-good critical snapshot
- existing small/high-signal sources such as URLhaus

### Background hydration

- cached structured feeds parsed off the critical path
- atomic replace of in-memory sets after the new snapshot is complete

### Recurring updates

- hourly: high-signal realtime-ish feeds
- daily: medium-change feeds
- weekly: slow-moving curated sources

---

## Phase Selection Rule

Future sessions should:

1. read this file
2. check the `Progress Log`
3. select the first phase in sequence whose status is not `Complete`
4. read only that phase file and its listed files

Do not start later phases early.

---

## Progress Log

### Phase 1 — Parser Foundation

- Status: Ready
- Date: —
- Commit: —
- Summary: Add source-driven parser definitions and shared parsing helpers for domain, URL, JSON, and CSV feeds without changing startup behavior yet.
- Remaining risks for next phase: Fast-start work must preserve current request-time behavior while introducing snapshot loading and atomic in-memory replacement.

### Phase 2 — Fast-Start Hydration

- Status: Planned
- Date: —
- Commit: —
- Summary: Replace synchronous full reload assumptions with cached startup snapshots, background hydration, and atomic in-memory swap.
- Remaining risks for next phase: Scheduling must not accidentally trigger overlapping refresh cycles or reload storms while a previous hydrate is still running.

### Phase 3 — Tiered Update Scheduler

- Status: Planned
- Date: —
- Commit: —
- Summary: Introduce per-source update cadence and freshness metadata so high-signal feeds refresh often while slower feeds remain cheap.
- Remaining risks for next phase: Feed expansion must stay curated; large low-signal lists should not be added just because the parser can ingest them.

### Phase 4 — Core Feed Expansion

- Status: Planned
- Date: —
- Commit: —
- Summary: Add a curated set of security feeds that fit the new parser and scheduler model without reintroducing startup stalls.
- Remaining risks after this track: CIDR/IP-range blocking remains a separate follow-up because it requires a different lookup model than domain-first `NetworkShield`.
