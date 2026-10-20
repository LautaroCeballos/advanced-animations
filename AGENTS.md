# AGENTS.md

MakeCode Arcade extension repo: `pxt-advanced-animations` (namespace `animations`).

## Structure
- `pxt.json` — extension manifest (`device: "*"`, version 0.1.0, files: main.ts, README.md, docs/*.md)
- `main.ts` — blocks in namespace `animations` (`block="Character+"`, blockIds `animations_*`); superset of microsoft/arcade-character-animations (bits 0-13 of `Predicate` identical; 14-19 are button/action-button additions)
- `README.md` — must keep the line `for PXT/Arcade`; without it the extension does not appear in searches
- `docs/` — one markdown per block, linked via `help=github:pxt-advanced-animations/docs/<name>`
- `icon.png` — 96x96, auto-detected by PXT (not listed in pxt.json files)

The repo is scaffolded. Test as Local extension in the MakeCode Arcade editor (import repo via GitHub), iterate by editing and refreshing.

## Commands
- No local toolchain. Build/test happens in the MakeCode Arcade editor: import repo via GitHub button, first `bump` generates tag, test as Local extension in a project, iterate by editing and refreshing.
- Do not rename published `blockId`s or the namespace.
