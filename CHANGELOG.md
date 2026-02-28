# Changelog

All notable changes to Tandem Browser will be documented in this file.

## [v0.15.2] - 2026-02-28

- feat: sidebar infrastructure — SidebarManager + config API

- New `SidebarManager` with JSON config storage (`~/.tandem/sidebar-config.json`)
- 7 default sidebar items: Workspaces, Messengers, Personal News, Pinboards, Bookmarks, History, Downloads
- 6 REST API endpoints: GET/POST config, toggle item, activate item, reorder, set state
- Sidebar state: hidden / narrow / wide (persisted across restarts)
- Wired into ManagerRegistry + will-quit cleanup
- Foundation for Fase 2 (Shell UI) and Fase 3 (Bookmarks panel)

## [v0.15.1] - 2026-02-28

- fix: About window now shows correct version

- Removed broken preload-about approach
- Version now hardcoded in shell/about.html (v0.15.0)
- Post-commit hook updated to auto-update about.html on version bump
- Cleaner and more reliable than runtime injection

## [v0.15.0] - 2026-02-28

- feat: add auto-versioning git hook + setup script

- git-hooks/post-commit: auto-bump version + update CHANGELOG
- setup-dev.sh: one-command dev environment setup
- Configures core.hooksPath to use git-hooks/ (committed in repo)
- Kees can run ./setup-dev.sh after next pull to enable hook
- Ensures consistent versioning across all dev machines

## [v0.14.3] - 2026-02-28

- fix: About window improvements (height 650, auto-version from package.json)

## [v0.14.2] - 2026-02-28

- fix: correct path depth for About window (shell/about.html now loads)

## [v0.14.1] - 2026-02-28

- feat: auto-sync webhook.secret with OpenClaw hooks.token (cross-platform fix)

## [v0.14.0] - 2026-02-27

- Initial stable release with 19/19 items complete
