# Copilot Instructions

Purpose
- Provide concise, actionable rules for Copilot and contributors so automated suggestions stay consistent with project conventions.

How Copilot should behave
- Prefer minimal, focused edits that match existing code style and patterns in the project.
- When making changes, keep diffs small and explain the intent in one sentence in the returned message (what changed and why).
- Never add secrets, credentials, or PII to code or examples.
- When in doubt, ask for clarification before making large cross-file changes.

Repository conventions (must follow)
- Components:
  - Location: All React components live under `app/components/` (or feature-specific subfolders, e.g. `app/components/search/`).
  - File naming: Use `PascalCase` for component filenames (e.g. `MyWidget.tsx`).
  - Single-responsibility: A component file should export the component (default export or named) and minimal local helpers only.

- Styles:
  - Put component styles in the same folder and name the file `<ComponentName>.styles.ts` (e.g. `MyWidget.styles.ts`).
  - Use MUI `sx` and MUI style helpers as appropriate; prefer consistent tokens from `theme.ts` when available.

- Types:
  - Put component-specific types in `<ComponentName>.types.ts` in the same folder.
  - Reuse types from a central `types/` or shared `utils` only when they are truly shared across features.

- Utils & helpers:
  - Put helper functions for a component in `<ComponentName>.utils.ts` in the same folder.
  - If a util is shared between features, promote it to `app/utils/` with clear naming and tests (if applicable).

- Hooks & logic:
  - Move non-UI logic into custom hooks when possible. Hook file naming: `<useName>.ts` or `<useName>.hook.ts` in the same folder or `app/hooks/` for shared hooks.
  - Hooks should return primitive values and handlers (avoid returning large component trees).
  - When a component has side-effects implemented with `useEffect`, prefer extracting those effects into small, focused custom hooks with descriptive names.
    - Examples: `useInitializeFromParams` (initialization from `useParams` / URL), `useSearchEffects` (handles search-related side-effects such as telemetry and debounced queries), `useFamilyModalEffects` (family-modal related data fetching and cleanup).
    - Each custom hook should encapsulate the `useEffect` calls required for that responsibility and expose only the state and handlers the component needs.
  - If keeping `useEffect` inside a component, group related side-effects into separate `useEffect` blocks with clear intent and a short comment describing responsibility.
    - Name the effect's purpose in a single-line comment above it, e.g., `// Sync URL params -> selectedDistrict/Constituency` or `// Increment telemetry counter on submit`.
    - Prefer smaller `useEffect` blocks that handle one responsibility rather than one large monolithic effect.

- Exports & barrel files:
  - Avoid large barrel files that import entire feature folders; prefer explicit imports in application code.

- Naming guidance:
  - Use descriptive names (e.g. `useElectorSearch` not `useSearch` when specific to elector search).
  - Keep abbreviations minimal and consistent.

- Tests and validation (recommended):
  - If you add non-trivial logic, include a unit test or at least a smoke test where practical.

Developer / workflow notes for Copilot suggestions
- When editing files, prefer matching surrounding style (indentation, semicolons, type usage).
- If adding a new component or file, create the sibling files as needed (styles, types, utils) when the change introduces them.
- Keep new code typesafe: annotate public props and exported functions.
- Provide a short usage example for newly created components in the commit message if it helps reviewers.

Commands & project scripts
- Dev server: `npm install` then `npm run dev`
- Linting: `npm run lint` (if available)
- Formatting: `npm run format` (if available)

How to reference this file when prompting Copilot/Chat
- Preferred prompt: "Follow `copilot-instructions.md` in the repository root when making edits to `app/components/...` — keep diffs minimal and move logic to a custom hook where possible." 
- If Chat has a repository-context toggle, enable it to allow the assistant to read this file automatically.

PR & commit checklist for Copilot-created changes
- Small, focused PR with descriptive title.
- Include: files changed, brief rationale, and any manual validation steps.
- Avoid touching unrelated files.

Safety & privacy
- Do not suggest or commit any secrets, keys, or real personal data.
- If sample data is needed, synthesize non-sensitive dummy data.

Example: Creating a new component
1. Files to add under `app/components/ExampleWidget/`:
   - `ExampleWidget.tsx` (component)
   - `ExampleWidget.styles.ts` (styles)
   - `ExampleWidget.types.ts` (types)
   - `ExampleWidget.utils.ts` (helper functions)
   - `useExampleWidget.ts` (custom hook if logic is required)
2. Keep the component file small; move data fetching and state logic into `useExampleWidget`.
3. Add a short example in the PR description showing typical usage.

If you want any additional rules (formatting preferences, specific lint rules to enforce, or commit-message templates), tell me and I’ll add them to this file.
