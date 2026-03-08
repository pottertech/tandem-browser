# Contributing

Thanks for contributing to Tandem Browser.

## Before You Start

- Read [README.md](README.md) for the product overview
- Read [PROJECT.md](PROJECT.md) for architecture context
- Keep changes local-first and privacy-preserving
- Avoid introducing new dependencies unless they are clearly justified

## Development Workflow

```bash
npm install
npm run verify
```

For manual app testing:

```bash
npm start
```

`TODO.md` is the active engineering backlog. Treat `docs/internal/ROADMAP.md`
and `docs/internal/STATUS.md` as historical snapshots, not the live source of
truth for day-to-day implementation work.

## Definition of Done

A task is only considered done when all of the following are true:

- the code or documentation change is complete
- `npm run verify` passes
- related docs are updated when behavior, API shape, or workflow changed
- a manual app check is done when Electron lifecycle or visible UI changed

Keep work scoped to one active task at a time when possible. Smaller finished
steps are better than broad partially-done rewrites.

## Coding Expectations

- TypeScript should compile cleanly
- Prefer focused patches over broad rewrites
- Keep Electron security defaults intact unless there is a reviewed reason to change them
- Do not introduce cloud dependencies into core browsing flows
- Keep public-facing text in English

## Commits

Use conventional commit prefixes:

- `fix:`
- `feat:`
- `chore:`
- `docs:`
- `refactor:`
- `test:`

## Pull Requests

A good pull request should include:

- a clear problem statement
- the implementation approach
- test or verification notes
- screenshots when UI changes are visible
- what is still open or risky, if anything

## Session Closeout

At the end of a session or PR, summarize:

- what was built or changed
- what was tested
- what remains open, risky, or intentionally deferred

## Security-Sensitive Changes

If a change touches stealth behavior, session isolation, extension loading, or
the local API security model, call that out explicitly in the PR description.
