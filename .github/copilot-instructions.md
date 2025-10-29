## Quick orientation for AI coding agents

This repository is a Node.js WhatsApp bot built on @whiskeysockets/baileys (Baileys v7 RC). The guidance below captures the project structure, runtime/deployment commands, conventions an agent should follow, and concrete examples from the code to be immediately productive.

Key facts
- Entry point: `src/index.js` — constructs the NekoEmit (socket wrapper) and wires `messages` and `groups` events to handlers in `src/handlers`.
- Socket wrapper: `src/connect/connect.js` exports `NekoEmit`. It creates the Baileys socket, saves auth to `./Auth_Info/<SESSION_ID>`, and exposes helper send/download methods (e.g. `sendTextMessage`, `sendStickerMessage`, `downloadMediaContent`).
- Commands loader: `src/utils/commands.js` dynamically imports every file under `src/commands/<category>/*` and expects a default export with metadata (see "Command contract").
- Message handling: `src/handlers/message.js` transforms incoming messages (via `sequilizer`) into an `M` object and applies group rules, anti-nsfw, anti-link, and command permission checks before executing the command.
- DB abstraction: `src/db/index.js` exports `userDBFunc` and `groupDBFunc`. Implementations live under `src/db/{user,group}/{json,aws}.js` — switchable by code-level import.

Environment & runtime
- Preferred run (development): set environment variables and run node: `export OWNER_NUMBER=...; export PHONE_NUMBER=...; export SESSION_ID=...; node src/index.js BOT_NUMBER`
- Production: PM2 is used — see `ecosystem.config.cjs`. Example: `pm2 start ecosystem.config.cjs -- BOT_NUMBER`.
- Important env variables used by the code (not all may be in README):
  - `OWNER_NUMBER` (comma-separated list) — owner accounts that get mod/pro/status privileges
  - `PHONE_NUMBER` — bot phone number used by pairing
  - `SESSION_ID` — name of the folder under `Auth_Info/` where multi-file auth state is persisted
  - Note: README suggests `src/config.json` for owner numbers; the code reads env variables. Prefer env variables when automating runs.

What to look at for edits/features
- To add a new command: create `src/commands/<category>/xyz.js` with a default export object that includes at least:
  - `name` (string)
  - `aliases` (array of strings) — optional
  - `cooldown` (seconds) — optional
  - flags used by message handler: `isGroup`, `isOwner`, `isAdmin`, `isBotAdmin`, `isMod`, `isPro`
  - `run` async function: `async (Neko, M, args) => { ... }`
  Example: the loader (`src/utils/commands.js`) does `commands.set(cmd.default?.name, cmd.default)` and registers aliases; message handler calls `cmd.run` via `cooldown(...)`.

Permissions and flow (how handler decides whether to run a command)
- `messageHandler` composes M via `sequilizer` then:
  - runs group-level checks (antilink, antilink removal, nsfw detector) — see `src/handlers/message.js` and `src/utils/nsfwDetector.js`.
  - checks `M.isCmd` then finds command via `Neko.commands.get(M.cmdName)`.
  - enforces runtime flags in this order: `mode` restrictions, mod/pro checks for DMs, `isGroup/isOwner/isAdmin/isBotAdmin/isMod` flags, then runs `cooldown` wrapper before invoking `cmd.run`.

Auth and pairing
- Authentication state is saved under `Auth_Info/<SESSION_ID>` via `useMultiFileAuthState` in `src/connect/connect.js`.
- If the credentials are not registered, code requests a pairing code with `Neko.requestPairingCode(process.env.PHONE_NUMBER)` and prints it to console — an agent making changes to pairing should avoid removing that behavior.

Patterns & conventions
- Dynamic imports for commands: every file in `src/commands/*` should default-export a command object (not CommonJS). The repo uses `type: module`.
- Utilities: helper functions and shared functionality live under `src/utils` (e.g., `connection.js`, `logs.js`, `sequelized.js`, `converter.js`). Use these instead of ad-hoc duplication.
- DB backends: two implementations exist (`json` and `aws`). The code imports `src/db/index.js` which re-exports the active implementations — prefer to follow existing functions (`getUser`, `setMod`, etc.).
- Event wiring: `NekoEmit` uses EventEmitter and emits `messages` and `groups`. Handlers receive `(Neko, m)` or similar shapes — check `src/index.js` for exact wiring.

Small gotchas
- README mentions editing `src/config.json`, but code primarily reads env variables. Confirm which you want to use before changing deployment scripts.
- The `Auth_Info` folder contains real secrets in this workspace — do not commit new credentials or leak them in PRs.

Where to run tests / build
- There are no automated tests in repo. Use `node src/index.js` locally (with env vars) or PM2 in an isolated environment to smoke-test. Ensure FFmpeg is installed for media-related commands.

If you need more details
- Ask for which file or command you want to extend. I can:
  - add a command scaffold under `src/commands/<category>/example.js`
  - convert config to use `src/config.json` consistently (or update README to prefer env vars)
  - add small unit tests around command loader and permission checks

-- End of agent guidance
