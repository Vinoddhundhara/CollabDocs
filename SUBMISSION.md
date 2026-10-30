# CollabDocs - Assessment Submission

**Candidate**: Senior Full-Stack Engineer  
**Role**: Ajaia LLC AI-Native Full Stack Developer  
**Project**: CollabDocs Collaborative Document Editor  
**Repository Working Directory**: `/Users/apple/Desktop/CollabDoc`  
**Video Walkthrough URL**: [https://www.loom.com/share/e634792a99c6442690c3287fa72d9b0e](https://www.loom.com/share/e634792a99c6442690c3287fa72d9b0e) (also documented in [`VIDEO_URL.txt`](./VIDEO_URL.txt))
**Video Walkthrough URL**: [https://www.loom.com/share/e634792a99c6442690c3287fa72d9b0e](https://www.loom.com/share/e634792a99c6442690c3287fa72d9b0e)  
**Project Artifacts & Codebase Drive Link**: [https://drive.google.com/file/d/1UcAYrXgZWZYmXmW4LRg___Aw89N3k6qz/view?usp=sharing](https://drive.google.com/file/d/1UcAYrXgZWZYmXmW4LRg___Aw89N3k6qz/view?usp=sharing)

---

## 1. Deliverables Checklist

- [x] **Client Source Code** (`client/`): React 18, Vite, TypeScript, Tailwind CSS, TipTap rich text editor.
- [x] **Server Source Code** (`server/`): Node.js, Express, TypeScript, Mongoose, Zod, bcrypt, JWT.
- [x] **Database & Seeder** (`server/src/scripts/seed.ts`): Idempotent seed script creating Alice, Bob, Charlie with pre-populated demo documents.
- [x] **Automated Test Suite** (`server/tests/api.test.ts`): 17/17 integration tests passing with Vitest & Supertest.
- [x] **Documentation**:
  - [`README.md`](./README.md): Setup, configuration, credentials, script catalog, reviewer guide.
  - [`ARCHITECTURE.md`](./ARCHITECTURE.md): Architecture diagrams, schemas, permission matrix, tradeoffs.
  - [`AI_WORKFLOW.md`](./AI_WORKFLOW.md): Detailed reflection on AI usage, corrections, and verifications.
  - [`SUBMISSION.md`](./SUBMISSION.md): Complete project report and assessment evaluation.
  - [`VIDEO_URL.txt`](./VIDEO_URL.txt): Public video walkthrough link reference.
- [x] **Deployment Configurations**:
  - `client/vercel.json`: Single-Page Application rewrites and cache headers.
  - `render.yaml`: Render web service blueprint for Express backend.
  - Complete step-by-step production deployment instructions.

---

## 2. What Works End-to-End

1. **Authentication & Quick Demo Account Switching**:
   - Seeded demo users (`alice@example.com`, `bob@example.com`, `charlie@example.com`) with password `Password123!`.
   - 1-click account switcher in Navbar allowing immediate reviewer switching to test access differences.
   - Real bcrypt hashing and signed JWT bearer tokens validated server-side.
2. **Rich-Text Document Authoring**:
   - TipTap ProseMirror engine supporting Bold, Italic, Underline, Heading 1, Heading 2, Heading 3, Bulleted Lists, Numbered Lists, Blockquotes, Horizontal Rules, and Undo/Redo.
   - Structured JSON AST persistence (no raw unsafe HTML stored).
3. **Autosave & Draft Preservation**:
   - 1200ms debounced autosave with real-time visual status indicator (`Saving...`, `Saved`, `Unsaved changes`, `Save error`).
   - In-memory draft retention preventing content loss on network hiccups, with instant manual "Retry Save".
   - Manual save button and keyboard shortcut (`Cmd+S` / `Ctrl+S`).
4. **File Import & Parsing**:
   - Accepts `.md`, `.markdown`, and `.txt` files up to 1 MB.
   - Validates extension, size, and safely converts Markdown syntax (headings, lists, blockquotes, bold/italic) into TipTap JSON nodes.
   - Persists through backend `/api/documents/import` and opens immediately.
5. **Granular Collaboration & Role-Based Permissions**:
   - Strict 3-tier hierarchy: **Owner** (full control), **Editor** (read/write), **Viewer** (read-only).
   - Server-side authorization check on every request:
     - Viewers attempting edits receive HTTP 403 Forbidden with a clear message.
     - Unauthorized users attempting to inspect or edit private documents receive HTTP 403 Forbidden.
     - Only owners can invite collaborators, alter roles, or delete documents.
6. **Document Export**:
   - One-click export to Markdown (`.md`), Plain Text (`.txt`), or structured TipTap JSON (`.json`).
7. **Production Builds & Automated Tests**:
   - Frontend compiles cleanly to `client/dist/` in 1.7s via `vite build`.
   - Backend compiles cleanly to `server/dist/` via `tsc`.
   - 17/17 automated integration tests pass in 865ms.

---

## 3. Deliberate Scope Cuts & Trade-Offs

- **Real-Time Multiplayer Cursor Synchronization (CRDT / Operational Transformation)**:
  - *Decision*: Cut in favor of rock-solid debounced HTTP autosave with strict role authorization.
  - *Reasoning*: Implementing Yjs or OT within the 4–6 hour assessment timebox carries significant synchronization edge-case risk that compromises baseline reliability. The current implementation provides a predictable, bug-free collaborative experience.
- **Image Upload to Cloud Storage**:
  - Stored inline rich-text and text formatting; cloud S3/Cloudinary bucket upload was omitted to adhere strictly to the zero-paid/zero-mandatory-credential requirement.

---

## 4. What Is Incomplete / Live Deployment Status

- **Live Cloud Deployment**:
  - The application is fully prepared for live deployment (includes `client/vercel.json`, `render.yaml`, environment variable maps, and a step-by-step guide in `README.md`).
  - *Honesty Statement*: Because this is a sandboxed evaluation environment without active external Vercel/Render authentication keys, no live cloud deployment has been triggered. The codebase was verified completely on local environments with real MongoDB connections and local ports.

---

## 5. What Would Be Built Next with Another 2–4 Hours

1. **Version History & Document Snapshots**:
   - Store revision snapshots on save, allowing users to view older versions, compare visual diffs, and restore previous drafts.
2. **Real-Time Presence Indicators (WebSockets)**:
   - Implement Socket.io to show colored avatars and active cursor positions for active viewers in the document header.
3. **Document Comments & Inline Annotations**:
   - Add a commenting sidebar where viewers and editors can leave comment threads linked to text highlights.
4. **Tagging & Folders**:
   - Organize documents into custom workspaces or folders with color-coded tags.

---

## 6. How AI Tools Were Used & How Outputs Were Verified

- **Scaffolding & Architecture**: AI assisted in configuring the monorepo structure, Mongoose schemas, and TipTap extension chain.
- **Parsing Logic**: AI assisted in crafting the AST translation between Markdown syntax and TipTap ProseMirror node structures.
- **Critical Oversight**:
  - Caught port collision issues on port 5001 and smoothly migrated to 5002.
  - Identified PostCSS parent-directory walking errors and pinned `browserslist` cleanly.
  - Corrected DOM TypeScript target mismatch for timer handles.
- **Verification**: Verified every claim using 17 automated tests, real `curl` requests, and successful production builds (`npm run build`).

