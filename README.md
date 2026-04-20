# HR Workflow Designer

> Tredence Analytics — Full Stack Engineering Intern case study.
> A production-grade visual designer for HR workflows (onboarding, leave approval,
> document verification) built with **React 19 + TypeScript + React Flow + Zustand
> + Tailwind CSS v4**.

This project implements the case-study brief as a **robust, enterprise-ready** web
module: an HR admin can visually compose, configure, simulate, and persist internal
workflows. Beyond the spec it ships error boundaries, undo/redo, toast feedback,
keyboard shortcuts, localStorage auto-save, schema-validated import, a unit test
suite, and a CI pipeline.

---

## Table of Contents

1. [Quick start](#quick-start)
2. [Feature walkthrough](#feature-walkthrough)
3. [Architecture](#architecture)
4. [Folder structure](#folder-structure)
5. [Data model & schema](#data-model--schema)
6. [Mock API](#mock-api)
7. [Validation & simulation](#validation--simulation)
8. [Robustness layer (enterprise features)](#robustness-layer-enterprise-features)
9. [Adding a new node type](#adding-a-new-node-type)
10. [Testing](#testing)
11. [Design decisions](#design-decisions)
12. [What I'd add next](#what-id-add-next)

---

## Quick start

```bash
# Install
npm install

# Run the dev server (http://localhost:5173)
npm run dev

# Full verification matrix (what CI runs)
npm run lint && npm run typecheck && npm test && npm run build
```

**Scripts:**

| Command              | Purpose                                                  |
|----------------------|----------------------------------------------------------|
| `npm run dev`        | Vite dev server with HMR                                 |
| `npm run build`      | Type-check + production build (`dist/`)                  |
| `npm run preview`    | Serve the production build locally                       |
| `npm run lint`       | ESLint with strict rules (errors on `any`, `console.log`)|
| `npm run typecheck`  | `tsc -b --noEmit`                                        |
| `npm test`           | Vitest run (unit tests, happy-dom)                       |
| `npm run test:watch` | Vitest watch mode                                        |
| `npm run test:ui`    | Vitest UI (browser-based test explorer)                  |

**Requirements:** Node ≥ 20.

No backend or authentication is required — the mock API is an in-process module
that resolves promises with a small simulated latency, and the workflow
auto-persists to `localStorage` (no server round-trip).

---

## Feature walkthrough

**Canvas actions:**

- **Drag** any node kind from the left palette onto the canvas
- **Connect** nodes by dragging between handles (self-loops and duplicates are blocked)
- **Click** a node to open the right-side inspector and edit it
- **Backspace / Delete** removes selected nodes and edges
- **Pan, zoom, fit-to-view**, plus a live **mini-map** (bottom-right)

**Node types** (all custom, all fully typed):

| Kind        | Purpose                                | Key fields                                                   |
|-------------|----------------------------------------|--------------------------------------------------------------|
| `start`     | Entry point (exactly one per workflow) | title, metadata key-value pairs                              |
| `task`      | Human task                             | title \*, description, assignee, due date, custom fields     |
| `approval`  | Manager/HRBP/Director/CEO approval     | title \*, approver role, auto-approve threshold              |
| `automated` | System-triggered action                | title, action from `/automations`, dynamic action params     |
| `end`       | Workflow completion (terminal)         | end message, summary flag                                    |

`*` required. The forms surface inline errors for empty required fields.

**Sandbox panel** (`Simulate` button or `⌘↵` / `Ctrl+Enter`):

1. Runs structural validation (single Start, no cycles, reachable End, etc.).
2. POSTs the graph to the mock `/simulate` endpoint.
3. Renders a **step-by-step timeline** with OK / SKIP / ERROR badges, cumulative
   elapsed time, and a per-step "locate node" link that jumps the selection
   back to the canvas.
4. Focus-trapped, Escape to close, dismisses on backdrop click.

**Keyboard shortcuts:**

| Shortcut          | Action               |
|-------------------|----------------------|
| `⌘Z` / `Ctrl+Z`   | Undo                 |
| `⌘⇧Z` / `Ctrl+Y`  | Redo                 |
| `⌘S` / `Ctrl+S`   | Export workflow JSON |
| `⌘↵` / `Ctrl+Enter` | Open simulator     |
| `Esc`             | Close sandbox / deselect |
| `Backspace` / `Del` | Delete selected node or edge |

(Modifier prefix adapts to platform — `⌘` on macOS, `Ctrl` elsewhere.)

---

## Architecture

The app is organised around a single **feature module** (`src/features/workflow/`)
with clear separation between UI shell, state, and services:

```
┌───────────────────────────────────────────────────────────┐
│                         App shell                         │
│  (Toolbar · Sidebar · Canvas · Inspector · Sandbox modal) │
│           ErrorBoundary  ·  Toasts  ·  ConfirmDialog      │
└───────────────────────────────────────────────────────────┘
                             │
           ┌─────────────────┼──────────────────┐
           │                 │                  │
   Zustand + Zundo store  Toast store    Confirm store
     (temporal history)    (notify UX)   (async confirm)
           │                 │                  │
           └─────────────────┴──────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
             Mock API layer        Shared types + utils
        (/automations, /simulate)   (discriminated unions,
           (swappable for real)      validation, persistence,
                                     logger, hotkeys)
                             │
                             ▼
                     localStorage (schema-versioned)
```

- **`store/workflowStore.ts`** is the single source of truth, wrapped in
  **Zundo temporal middleware** for undo/redo. Every mutation flows through the
  store so that history, persistence, and future collaboration only need one
  hook point.
- **`api/`** is promise-based and deliberately shaped like a `fetch` wrapper;
  swapping it for a real REST/gRPC client or MSW is a one-file change.
- **`features/workflow/nodes/nodeRegistry.ts`** is the *only* place that maps a
  `NodeKind` to defaults, label, and accent. Adding a new node kind touches the
  registry, the type union, and one form — **no canvas or store changes**.
- **`utils/validation.ts`** is pure and is reused by both the simulate endpoint
  and the sandbox UI. Validation is authoritative in one place.
- **`utils/persistence.ts`** owns the Zod-validated disk format: one schema,
  versioned, used by both localStorage and JSON import.

---

## Folder structure

```
src/
├── api/                              # Mock API layer
│   ├── automations.ts                # GET /automations
│   ├── simulate.ts                   # POST /simulate (pure, unit-tested)
│   └── index.ts
├── components/
│   ├── ConfirmDialog.tsx             # Promise-based confirm (replaces window.confirm)
│   ├── ErrorBoundary.tsx             # React error boundary with logger integration
│   ├── Toasts.tsx                    # Portal-rendered toast stack (a11y: role=status)
│   ├── icons.tsx                     # Inline SVG icons
│   └── ui/                           # Generic primitives
│       ├── Button.tsx                # forwardRef, focus-visible ring, 4 variants
│       ├── Field.tsx                 # Label + input/select/textarea/checkbox
│       └── KeyValueEditor.tsx        # Reusable repeating key-value widget
├── features/workflow/
│   ├── canvas/Canvas.tsx             # React Flow provider + canvas surface
│   ├── forms/                        # Dynamic per-kind forms
│   │   ├── NodeFormPanel.tsx         # Inspector shell (delegates per kind)
│   │   ├── StartNodeForm.tsx
│   │   ├── TaskNodeForm.tsx
│   │   ├── ApprovalNodeForm.tsx
│   │   ├── AutomatedNodeForm.tsx     # Renders params dynamically from API response
│   │   └── EndNodeForm.tsx
│   ├── nodes/
│   │   ├── NodeShell.tsx             # Shared visual shell + handles
│   │   ├── nodeTypes.tsx             # Thin per-kind wrappers
│   │   ├── nodeTypesMap.ts           # Kind → component map for React Flow
│   │   └── nodeRegistry.ts           # Kind → {label, defaults, accent}
│   ├── sandbox/SandboxPanel.tsx      # Simulate + timeline + focus-trapped modal
│   ├── sidebar/Sidebar.tsx           # Draggable palette of node kinds
│   └── toolbar/Toolbar.tsx           # Undo/redo + import/export/reset + simulate
├── hooks/
│   ├── useAutomations.ts             # Fetch + cache the /automations list
│   └── useHotkeys.ts                 # Cross-platform keyboard shortcuts
├── store/
│   ├── workflowStore.ts              # Zustand + Zundo (undo/redo) + persist
│   ├── toastStore.ts                 # Global toast notifications
│   └── confirmStore.ts               # Global confirmation dialogs
├── test/
│   └── setup.ts                      # Vitest bootstrap (RTL, cleanup)
├── types/
│   ├── workflow.ts                   # Discriminated union of node data
│   └── index.ts
├── utils/
│   ├── validation.ts                 # Cycle + reachability + field checks
│   ├── persistence.ts                # Zod schema + localStorage
│   └── logger.ts                     # Pluggable structured logger
├── App.tsx                           # Layout shell + global hotkeys + boundaries
├── index.css                         # Tailwind tokens + React Flow base styles
└── main.tsx
```

---

## Data model & schema

The core contract is a discriminated union on `kind`:

```ts
type WorkflowNodeData =
  | StartNodeData     // { kind: 'start',     title, metadata[] }
  | TaskNodeData      // { kind: 'task',      title, description, assignee, dueDate, customFields[] }
  | ApprovalNodeData  // { kind: 'approval',  title, approverRole, autoApproveThreshold }
  | AutomatedNodeData // { kind: 'automated', title, actionId, actionParams }
  | EndNodeData;      // { kind: 'end',       message, summary }

type WorkflowNode =
  | StartNode | TaskNode | ApprovalNode | AutomatedNode | EndNode;

type WorkflowGraph = { nodes: WorkflowNode[]; edges: Edge[] };
```

This discriminated union is the single type flowing through the app.
`switch (data.kind)` exhausts it — TypeScript narrows correctly inside forms, the
simulate engine, and the persistence layer. No `as` casts in the happy path.

The same shape is mirrored as a **Zod schema** in `utils/persistence.ts`:

```ts
const NodeDataSchema = z.discriminatedUnion('kind', [ /* ... */ ]);
const GraphSchema   = z.object({
  nodes: z.array(NodeSchema).max(500),
  edges: z.array(EdgeSchema).max(2000),
});
const PersistedSchema = z.object({
  version: z.number(),
  graph:   GraphSchema,
  savedAt: z.string(),
});
```

**Import safety:** every uploaded JSON file is size-limited (2 MB hard cap) and
validated against the schema before it ever touches the store. Malformed files
produce a scoped error toast with the first schema violation; nothing else
leaks in.

---

## Mock API

Location: `src/api/`. The layer is promise-based and deliberately shaped like a
`fetch` wrapper so it can be swapped for a real endpoint (or MSW handler) with
zero component changes.

### `GET /automations`

```ts
fetchAutomations(): Promise<AutomationDefinition[]>
```

Returns five seeded actions (send_email, generate_doc, create_ticket,
provision_account, post_slack). Each defines `params: string[]` — the Automated
Step form builds its input fields dynamically from this list, so adding a new
parameter to an action requires no UI changes.

The hook `useAutomations()` de-duplicates in-flight requests and caches the result
module-scope, so multiple Automated nodes opened in sequence share a single
network call.

### `POST /simulate`

```ts
simulateWorkflow({ graph }): Promise<SimulationResult>
```

- Runs the same validation the UI runs (authoritative, single source).
- If validation fails, returns `ok: false` with one step per error.
- Otherwise DFS-walks the graph from the Start node, emitting one step per
  reachable node (nodes unreachable from Start are appended as `SKIP` entries).
- Each step reports `kind`, `title`, a status (`ok | info | skipped | error`),
  a human-readable `message`, and a cumulative `elapsedMs`.
- Automated steps are "executed" with their bound action + params; missing
  required params surface as per-step errors.

---

## Validation & simulation

`utils/validation.ts` owns structural checks. It runs in O(V + E) and returns
both errors (block simulation) and warnings (informational):

| Issue                                            | Severity |
|--------------------------------------------------|----------|
| No Start node                                    | error    |
| More than one Start node                         | error    |
| Start node has incoming edges                    | error    |
| End node has outgoing edges                      | error    |
| Task / Approval with empty required title        | error    |
| Automated step with no action selected           | error    |
| Graph contains a cycle                           | error    |
| No End node present                              | warning  |
| End node unreachable from Start                  | warning  |
| Intermediate node with no incoming or outgoing   | warning  |

Cycle detection uses DFS with WHITE/GRAY/BLACK colouring. Reachability uses BFS
from the Start node.

---

## Robustness layer (enterprise features)

Everything above the spec that makes this production-grade:

- **`<ErrorBoundary>`** wraps the app and each major pane (`sidebar`, `canvas`,
  `inspector`, `sandbox`). A crashing component shows a scoped recovery card
  with error details and doesn't nuke the rest of the UI. Errors are forwarded
  to the pluggable `logger` for future Sentry-style export.
- **Structured logger** (`utils/logger.ts`) with `registerSink()` — drop in a
  Datadog/Sentry/Segment sink in one line.
- **Toast system** (`store/toastStore.ts` + `components/Toasts.tsx`) with four
  variants, auto-dismiss, `role=status` / `aria-live`, portal-rendered.
- **Confirm dialog** (`store/confirmStore.ts` + `components/ConfirmDialog.tsx`):
  promise-based, keyboard-operable (`Enter` confirms, `Esc` cancels), replaces
  the blocking `window.confirm()` in every destructive action.
- **Undo / Redo** via [Zundo](https://github.com/charkour/zundo) temporal
  middleware (limit 50 states, partialized to just `nodes`/`edges`). Wired to
  the toolbar buttons and keyboard shortcuts.
- **localStorage auto-save** with a **schema version** check. On boot, the app
  tries to restore the last workflow; if the stored schema is outdated or
  corrupt, it's discarded silently and the app falls back to the seed.
- **JSON import hardening** — Zod-validated, size-capped (2 MB), tolerant of
  both raw graphs and the persisted `{ version, graph, savedAt }` wrapper.
- **Keyboard shortcuts** (`hooks/useHotkeys.ts`) with cross-platform `mod` token
  and automatic suppression inside `input`/`textarea`/`contenteditable`.
- **Focus management** — the sandbox modal focus-traps, restores focus on
  close, and the confirm dialog auto-focuses its default action.
- **Duplicate / self-loop edge prevention** in the store.

---

## Adding a new node type

This is the extensibility test the case study asks for. Adding, say, a
`NotificationNode` requires changes in **exactly four files**:

1. **`types/workflow.ts`** — add `NotificationNodeData` to the union and the
   `'notification'` literal to `NODE_KINDS`. Mirror in the Zod `NodeDataSchema`.
2. **`features/workflow/nodes/nodeRegistry.ts`** — register defaults, label, accent.
3. **`features/workflow/nodes/nodeTypes.tsx`** + `nodeTypesMap.ts` — add a thin
   wrapper over `NodeShell`.
4. **`features/workflow/forms/NotificationNodeForm.tsx`** + one case in
   `NodeFormPanel`'s switch.

No changes to the canvas, store, sidebar, toolbar, sandbox, or validation engine
are required — the registry drives the sidebar and defaults, the discriminated
union drives the form switch, and validation short-circuits on kinds it doesn't
know specific rules for. This was an explicit design goal.

---

## Testing

32 unit tests across 5 files using **Vitest** + **happy-dom**:

| File                                 | Coverage                                                           |
|--------------------------------------|--------------------------------------------------------------------|
| `utils/validation.test.ts`           | Start / End / orphan / cycle / reachability / title / action rules |
| `utils/persistence.test.ts`          | Zod parse, size limits, localStorage roundtrip, schema versioning  |
| `api/simulate.test.ts`               | Linear traversal, skipped orphans, param validation, cycle halt    |
| `store/workflowStore.test.ts`        | CRUD, edge guards, undo/redo round-trip                            |
| `hooks/useHotkeys.test.ts`           | Combo matching, input suppression, shift variants                  |

Run:

```bash
npm test            # single run (what CI runs)
npm run test:watch  # interactive
npm run test:ui     # browser-based explorer
```

### Continuous integration

`.github/workflows/ci.yml` runs on every push and PR to `main` across Node 20
and 22. Each job runs: `lint` → `typecheck` → `test` → `build` and uploads the
`dist/` artifact.

---

## Design decisions

**Why Zustand + Zundo instead of Context/Redux + redux-undo?**
Zustand is three lines of boilerplate, and Zundo's `temporal` middleware adds
undo/redo without changing a single action shape. Context would cause
whole-tree re-renders on every node drag; Redux is overkill for the action
surface.

**Why discriminated unions over a generic `Node<T>`?**
`NodeProps<StartNode>` etc. give each form and each custom component fully
typed `data`. No `as` casts inside components; `switch (data.kind)` exhausts
the union. The same contract is mirrored one layer out in Zod.

**Why in-process mocks instead of MSW / JSON Server?**
MSW requires a service-worker install dance and JSON Server requires a second
process. For a time-boxed case study the in-process layer is cheaper, equally
swap-able, and doesn't break StackBlitz/Codespaces previews. The module still
speaks "Promise" so replacing it with `fetch()` is a one-file change.

**Why render the entire Automated Step form from `params: string[]`?**
It demonstrates dynamic form construction from API-driven metadata, which is
called out explicitly in the case study ("dynamic fields"). Users see the
inspector rebuild itself when they switch actions.

**Why one `NodeShell` instead of five hand-crafted node visuals?**
Consistency ships faster, restyles globally, and keeps the accent-colour
system in one place. Each node variant supplies its own icon, subtitle, and
optional footer — the shell handles handles, selection ring, and the
colour-chip.

**Why Tailwind v4?**
Zero-config via the Vite plugin, and `@theme { --color-* }` tokens give
semantic colour names that map cleanly to node kinds.

**Why a schema-versioned localStorage blob instead of `JSON.stringify` direct?**
The moment the shape changes (add a field, rename a kind), unversioned data
crashes the app on next boot. A single `version: 1` check with a Zod parse lets
us bump the schema and fall back gracefully instead of wedging users.

---

## What I'd add next

- **E2E Playwright suite** for the drag → connect → edit → simulate flow.
- **Visual validation on nodes** — red outline for nodes that fail validation,
  not just the sandbox report.
- **Auto-layout** via `@dagrejs/dagre` behind a toolbar button.
- **Node templates** — save a configured subgraph as a reusable block.
- **Per-workflow slots in localStorage** so users can juggle multiple drafts.
- **Dark mode** — tokens are already in place; just a media-query swap.
- **Storybook** for the UI primitives (`Button`, `Field`, `KeyValueEditor`,
  `NodeShell`) so they can be reused across future HR tooling.
- **Accessibility pass** — keyboard fallback for the drag-and-drop palette
  ("Add Start node" buttons), focus-visible polish.
- **Remote persistence** — swap the localStorage layer for a real backend, same
  schema.

---

## Assessment criteria mapping

| Area                  | Where to look                                                              |
|-----------------------|----------------------------------------------------------------------------|
| React Flow proficiency| `canvas/`, `nodes/`, custom node handles in `NodeShell.tsx`                |
| React architecture    | `store/`, `hooks/`, feature modules, error boundaries in `App.tsx`         |
| Complex form handling | `forms/*`, `AutomatedNodeForm.tsx` (dynamic params), `KeyValueEditor.tsx`  |
| Mock API interaction  | `api/*`, `useAutomations.ts` (caching + de-dupe)                           |
| Scalability           | `nodeRegistry.ts` + discriminated union + Zod schema                       |
| Communication         | This README, inline TypeScript types, structured logger                    |
| Delivery speed        | See `git log`                                                              |
| Quality & robustness  | Error boundaries, tests, CI, schema validation, a11y focus management     |

---

Built for Tredence Analytics' Full Stack Engineering Intern case study.
