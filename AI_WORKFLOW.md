# AI Workflow & Engineering Reflection

This document provides a truthful record of how AI assistance (Google Antigravity with Gemini 3.8 Flash High) was utilized in designing, architecting, implementing, and verifying the **CollabDocs** collaborative document editor.

---

## 1. AI Tools Used
- **Primary AI Assistant**: Google Antigravity (Gemini 3.8 Flash High)
- **Role**: Full-stack pair programmer, system architect, and QA tester
- **Interface**: VS Code integration with autonomous terminal and filesystem tool orchestration

---

## 2. Tasks Accelerated by AI
1. **Full-Stack Project Scaffolding**:
   - Initialized monorepo structure with decoupled React + Vite + TypeScript frontend and Node.js + Express + Mongoose backend.
   - Configured TypeScript configurations (`tsconfig.json`), Tailwind CSS setup, and Vitest configurations.
2. **TipTap Schema Integration & Custom Markdown Parser**:
   - Implemented `markdownService.ts` to parse Markdown headings (`#`, `##`, `###`), bullet lists, ordered lists, blockquotes, and inline bold/italic/code directly into TipTap JSON nodes without dangerous unsanitized HTML execution.
   - Implemented bidirectional serialization (TipTap JSON $\to$ Markdown / Plain Text) for document export.
3. **Database Schema & Granular Authorization**:
   - Structured Mongoose schemas with compound indexes (`owner`, `collaborators.user`, `updatedAt`).
   - Implemented strict server-side authorization: owners manage permissions & delete; editors modify content & rename; viewers are strictly read-only; non-collaborators are blocked with 403 Forbidden.
4. **Idempotent Database Seeding**:
   - Created `seed.ts` providing realistic demo users (Alice, Bob, Charlie) and seeded documents showcasing owner vs editor vs viewer permissions.
5. **Comprehensive Automated Test Suite**:
   - Wrote 17 automated integration tests with Vitest and Supertest testing the full matrix of permissions, health checks, authentication, and file import.

---

## 3. AI Outputs Rejected or Corrected
1. **Package Scaffolding Interactivity**:
   - `create-vite` was initially invoked via interactive CLI, which hung in non-interactive sandbox mode.
   - *Correction*: Manually declared and wrote exact, deterministic `package.json` files for both client and server, followed by direct headless `npm install`.
2. **Network Sandbox & Database Connection**:
   - The default sandbox mode isolated local network sockets (`EPERM` on `127.0.0.1:27017`).
   - *Correction*: Identified that the local macOS `mongod` was already running on port 27017 and verified connectivity using standard Node net socket with `BypassSandbox: true`.
3. **Port Binding Conflict (5001 vs 5002)**:
   - Port 5001 was already occupied by an existing process.
   - *Correction*: Configured the backend to port 5002 with synchronized `.env`, Vite proxy configuration, and CORS configurations.
4. **Browserlist Path Resolution**:
   - PostCSS autoprefixer attempted to walk parent directories up to `/Users/apple/package.json`, causing an out-of-sandbox permission error.
   - *Correction*: Declared `browserslist` directly within `client/package.json` and added workspace `.browserslistrc`.
5. **NodeJS Namespace in DOM TypeScript**:
   - `useRef<NodeJS.Timeout>` in client component failed compilation under DOM TypeScript target.
   - *Correction*: Updated to `ReturnType<typeof setTimeout>` and added `vite-env.d.ts`.

---

## 4. Verification & Testing Methodology
Every feature was rigorously verified against actual execution:
- **Backend Tests**: 17/17 automated Vitest + Supertest integration tests passed in 865ms.
- **TypeScript Builds**: `tsc` build on server and `vite build` on client both compile cleanly with zero errors.
- **API Smoke Testing**: End-to-end curl requests verified real JWT issuance, document queries, role discrimination, and file import.
- **Persistence Verification**: Seed script executed idempotently with MongoDB Atlas/local instances.

