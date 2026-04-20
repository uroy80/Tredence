# HR Workflow Designer

> Tredence Analytics — Full Stack Engineering Intern case study.
> A visual designer for HR workflows (onboarding, leave approval, document verification)
> built with **React 19 + TypeScript + React Flow + Zustand + Tailwind CSS v4**.

This project is a working prototype of a module an HR admin could use to *visually*
compose, configure, and simulate an internal workflow. It's intentionally scoped to
the 4–6 hour time-box in the case study and focuses on **architectural clarity** and
**extensibility** over UI polish.

---

## Table of Contents

1. [Getting started](#getting-started)
2. [Feature walkthrough](#feature-walkthrough)
3. [Architecture](#architecture)
4. [Folder structure](#folder-structure)
5. [Data model](#data-model)
6. [Mock API](#mock-api)
7. [Validation & simulation](#validation--simulation)
8. [Adding a new node type](#adding-a-new-node-type)
9. [Design decisions](#design-decisions)
10. [What I'd add with more time](#what-id-add-with-more-time)

---

## Getting started

```bash
# Install
npm install

# Run the dev server (http://localhost:5173)
npm run dev

# Type-check + production build
npm run build

# Preview the production build
npm run preview
```

**Requirements:** Node ≥ 20.

No backend or authentication is required — the mock API is an in-process module that
resolves promises with a small simulated latency.

---

## Feature walkthrough

| # | Requirement from spec | Where it lives |
|---|---|---|
| 1 | React app (Vite) | `vite.config.ts`, `src/main.tsx` |
| 2 | React Flow canvas with multiple custom nodes | `src/features/workflow/canvas` + `src/features/workflow/nodes` |
| 3 | Node edit forms per type | `src/features/workflow/forms` |
| 4 | Mock API (`GET /automations`, `POST /simulate`) | `src/api` |
| 5 | Workflow test / sandbox panel | `src/features/workflow/sandbox` |
| 6 | README, architecture, assumptions | this file |

**Canvas actions supported:**

- Drag nodes from the left palette onto the canvas
- Connect nodes by dragging between handles (validated: no self-loops)
- Click a node to open the right-side inspector and edit it
- Press `Backspace` / `Delete` on a selected node or edge to remove it
- Pan, zoom, fit-to-view, and a live mini-map (bottom-right)

**Node types** (all custom, all typed):

| Kind        | Purpose                                | Key fields                                                   |
|-------------|----------------------------------------|--------------------------------------------------------------|
| `start`     | Entry point (one per workflow)         | title, metadata key-value pairs                              |
| `task`      | Human task                             | title \*, description, assignee, due date, custom fields     |
| `approval`  | Manager/HRBP/Director/CEO approval     | title \*, approver role, auto-approve threshold              |
| `automated` | System-triggered action                | title, action from `/automations`, dynamic action params     |
| `end`       | Workflow completion (terminal)         | end message, summary flag                                    |

`*` required. The forms surface inline validation errors for empty required fields.

**Sandbox panel** (`Simulate` button, top-right):

1. Runs structural validation (single Start, no cycles, no orphan nodes, reachable End, etc.).
2. POSTs the full graph to the mock `/simulate` endpoint.
3. Renders a **step-by-step timeline** with OK / SKIP / ERROR badges, elapsed time,
   and a per-step "locate node" link that jumps the selection back on the canvas.
4. Surfaces the raw request metadata for debugging.

**Bonus features shipped** (case study called these optional):

- **Import / export workflow as JSON** — serialize the full graph to disk and reload it.
- **Mini-map and zoom controls** on the canvas.
- **Cycle detection** via DFS colouring.
- **Reachability check** from Start to End.
- **Dynamic automated-step params** — the form rebuilds itself whenever the chosen action changes.

---

## Architecture

The app is organised around a single **feature module** (`src/features/workflow/`) with clear separation between:

```
┌───────────────────────────────────────────────────────────┐
│                         App shell                         │
│  (Toolbar · Sidebar · Canvas · Inspector · Sandbox modal) │
└───────────────────────────────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
           Zustand store            Mock API layer
      (nodes, edges, selection)   (/automations, /simulate)
                 │                       │
                 └───────────┬───────────┘
                             │
                      Shared types + utils
                  (discriminated unions, validation)
```

- **`store/workflowStore.ts`** is the single source of truth. Every component is a
  thin consumer — React Flow change events (`onNodesChange`, `onEdgesChange`,
  `onConnect`) flow through the store so that any future persistence, undo/redo, or
  collaboration layer only has one place to hook in.
- **`api/`** is a plain async module. Swapping it for a real REST/gRPC client, or
  plugging in MSW for Jest tests, is a one-file change — no component knows where
  automations come from.
- **`features/workflow/nodes/nodeRegistry.ts`** is the *only* place that maps a
  `NodeKind` to its default data, label, and accent. Adding a new node type means
  touching the registry, the type union, and adding one form — no canvas or store
  changes.
- **`utils/validation.ts`** is pure and is reused by both the simulate mock and the
  sandbox UI. Validation is authoritative in one place.

### State flow

```
Sidebar (drag) ──► dragstart(MIME=kind)
                               │
                               ▼
    Canvas.onDrop ──► store.addNode(kind, flowPosition)

Canvas (click) ──► store.setSelectedNode(id)
                               │
                               ▼
    NodeFormPanel renders form for the selected node
                               │
 (controlled input) ──► store.updateNodeData(id, patch)
                               │
                               ▼
    React Flow re-renders the matching custom node

Toolbar.Simulate ──► SandboxPanel.run
                               │
                               ▼
  validateWorkflow(graph) ──► simulateWorkflow(graph)
                               │
                               ▼
                 Timeline + validation report
```

---

## Folder structure

```
src/
├── api/                          # Mock API layer (automations, simulate)
│   ├── automations.ts
│   ├── simulate.ts
│   └── index.ts
├── components/
│   ├── icons.tsx                 # Inline SVG icons (no icon lib)
│   └── ui/                       # Generic primitives
│       ├── Button.tsx
│       ├── Field.tsx             # Label + input/select/textarea/checkbox
│       └── KeyValueEditor.tsx    # Reusable repeating key-value widget
├── features/workflow/
│   ├── canvas/Canvas.tsx         # React Flow provider + canvas surface
│   ├── forms/                    # Dynamic per-kind forms
│   │   ├── NodeFormPanel.tsx     # Right-side inspector (delegates per kind)
│   │   ├── StartNodeForm.tsx
│   │   ├── TaskNodeForm.tsx
│   │   ├── ApprovalNodeForm.tsx
│   │   ├── AutomatedNodeForm.tsx
│   │   └── EndNodeForm.tsx
│   ├── nodes/                    # Custom node components
│   │   ├── NodeShell.tsx         # Shared visual shell + handles
│   │   ├── nodeTypes.tsx         # Thin per-kind wrappers
│   │   └── nodeRegistry.ts       # Kind → {label, defaults, accent}
│   ├── sandbox/SandboxPanel.tsx  # Simulate + timeline + validation report
│   ├── sidebar/Sidebar.tsx       # Draggable palette of node kinds
│   └── toolbar/Toolbar.tsx       # Import/export/reset + simulate trigger
├── hooks/
│   └── useAutomations.ts         # Fetch + cache the /automations list
├── store/
│   └── workflowStore.ts          # Zustand store (nodes, edges, selection, actions)
├── types/
│   ├── workflow.ts               # Discriminated union of node data
│   └── index.ts
├── utils/
│   └── validation.ts             # Structural checks: cycles, orphans, reachability
├── App.tsx                       # Layout shell
├── index.css                     # Tailwind + React Flow base styles + theme tokens
└── main.tsx
```

---

## Data model

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

Because `kind` is the discriminator, TypeScript narrows correctly inside forms and
the simulate engine — no casts required in the happy path.

---

## Mock API

Location: `src/api/`. The layer is promise-based and deliberately looks like a
`fetch` wrapper so that it can be swapped for a real endpoint (or MSW handler) with
zero component changes.

### `GET /automations`

```ts
fetchAutomations(): Promise<AutomationDefinition[]>
```

Returns five seeded actions (send_email, generate_doc, create_ticket,
provision_account, post_slack). Each defines `params: string[]` — the Automated Step
form builds its input fields dynamically from this list, so adding a new parameter
to an action requires no UI changes.

The hook `useAutomations()` de-duplicates in-flight requests and caches the result
module-scope, so multiple Automated nodes open in sequence share a single network call.

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

Cycle detection uses standard DFS with WHITE/GRAY/BLACK colouring. Reachability
uses BFS from the Start node.

---

## Adding a new node type

This is the extensibility test the case study asks for. Adding, say, a
`NotificationNode` requires changes in **exactly four files**:

1. **`types/workflow.ts`** — add `NotificationNodeData` to the union and the
   `'notification'` literal to `NODE_KINDS`.
2. **`features/workflow/nodes/nodeRegistry.ts`** — register defaults, label, accent.
3. **`features/workflow/nodes/nodeTypes.tsx`** — add a thin wrapper over `NodeShell`.
4. **`features/workflow/forms/NotificationNodeForm.tsx`** + one case in
   `NodeFormPanel`'s switch.

No changes to the canvas, store, sidebar, toolbar, sandbox, or validation engine
are required — the registry drives the sidebar and defaults, the discriminated
union drives the form switch, and validation short-circuits on kinds it doesn't
know specific rules for. This was an explicit design goal.

---

## Design decisions

**Why Zustand instead of Context/Redux?**
Zustand is three lines of boilerplate, selectors are `useStore(s => s.slice)`, and
it pairs cleanly with React Flow's change-event handlers (every handler is a
store action). Context would cause whole-tree re-renders on every node drag;
Redux is overkill for a ~10 action surface.

**Why discriminated unions over generic `Node<T>`?**
`NodeProps<StartNode>` etc. give each form and each custom component fully typed
`data`. No `as` casts inside components; `switch (data.kind)` exhausts the union.

**Why in-process mocks instead of MSW / JSON Server?**
MSW requires a service-worker install dance and JSON Server requires a second
process. For a 4–6 h case study with no persistence requirement, a clean
promise-returning module is cheaper, equally swap-able, and doesn't break
StackBlitz/Codespaces previews. The layer is still abstracted so replacing it
with `fetch()` is a one-file change.

**Why render the entire Automated Step form from `params: string[]`?**
It demonstrates dynamic form construction from API-driven metadata, which is
called out explicitly in the case study ("dynamic fields"). Users can see
the inspector rebuild itself when they switch actions.

**Why a single `NodeShell` instead of five hand-crafted node visuals?**
Consistency is faster to ship, easier to restyle globally, and keeps the
accent-colour system in one place. Each node variant supplies its own icon,
subtitle, and optional footer content — the shell handles handles, selection
ring, and the coloured header chip.

**Why Tailwind v4?**
Zero-config via the Vite plugin, and `@theme { --color-* }` tokens give semantic
colour names that map cleanly to the node kinds. No PostCSS plumbing.

---

## What I'd add with more time

Given another day:

- **Undo/redo** via Zundo (Zustand middleware) — the store is already the one
  place state changes happen, so this is basically free.
- **LocalStorage auto-save** with per-workflow slots.
- **Unit tests** with Vitest for `utils/validation.ts` (pure, easy) and
  `api/simulate.ts` (pure, easy). RTL for form contracts.
- **E2E happy path** with Playwright: drag → connect → edit → simulate → assert
  timeline order.
- **Visual validation on nodes** — outline failing nodes in red on the canvas,
  not just in the sandbox report.
- **Auto-layout** via `@dagrejs/dagre` — one button, tidy graph.
- **Node version history** — structurally easy once Zundo is in; the trickier
  piece is diff-ing and surfacing the diff in the UI.
- **Accessibility pass** — the drag-and-drop palette should have a keyboard
  fallback ("Add Start node" buttons), and the sandbox modal needs a focus
  trap + escape-to-close.
- **Component library** — extract `Button`, `Field`, `KeyValueEditor`,
  `NodeShell` into a documented Storybook so they can be reused across future
  HR tooling.

---

## Assessment criteria mapping

| Area                  | Where to look                                                              |
|-----------------------|----------------------------------------------------------------------------|
| React Flow proficiency| `Canvas.tsx`, `NodeShell.tsx`, `nodeTypes.tsx`                             |
| React architecture    | `store/`, `hooks/`, `features/workflow/*`                                  |
| Complex form handling | `forms/*`, `AutomatedNodeForm.tsx` (dynamic params), `KeyValueEditor.tsx`  |
| Mock API interaction  | `api/automations.ts`, `api/simulate.ts`, `hooks/useAutomations.ts`         |
| Scalability           | `nodeRegistry.ts` + discriminated union contract                           |
| Communication         | This README + inline types                                                 |
| Delivery speed        | See `git log`                                                              |

---

Built for Tredence Analytics' Full Stack Engineering Intern case study.
