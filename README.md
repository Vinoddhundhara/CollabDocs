# CollabDocs 📄

> A lightweight, modern Google Docs-inspired collaborative document editor built for the **Ajaia LLC AI-Native Full Stack Developer** assessment.

CollabDocs delivers rich-text authoring, granular role-based permissions (Owner, Editor, Viewer), debounced autosave with draft retention, safe file import/export, and instant reviewer demo account switching.

---

## 🚀 Quick Start (Reviewer Walkthrough in 2 Minutes)

### 1. Prerequisites
- **Node.js**: `v20.x` or higher (tested on `v20.20.2`)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or free MongoDB Atlas URI

### 2. Installation
From the root directory:
```bash
# Install root, server, and client dependencies
npm run install:all
```

### 3. Environment Configuration
The project is pre-configured with local defaults in `.env` files:

- **Server (`server/.env`)**:
  ```ini
  PORT=5002
  NODE_ENV=development
  MONGODB_URI=mongodb://localhost:27017/collabdocs
  JWT_SECRET=collabdocs_dev_jwt_secret_ajaia_assessment_key_32bytes
  CORS_ORIGIN=http://localhost:5173,http://localhost:3000
  ```

- **Client (`client/.env`)**:
  ```ini
  VITE_API_URL=http://localhost:5002
  ```

### 4. Database Seeding
Seed demo users and initial documents with distinct permission levels:
```bash
npm run seed
```

### 5. Run the Application
Run both backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5002](http://localhost:5002)
- **Health Check**: [http://localhost:5002/api/health](http://localhost:5002/api/health)

---

## 👥 Demo Reviewer Accounts

Pre-seeded accounts are provided to easily verify the role permission matrix without manual user registration:

| Name | Email | Password | Role in Seeded Data |
|---|---|---|---|
| **Alice Henderson** | `alice@example.com` | `Password123!` | Owner of "Product Strategy" & "Architecture Specs" |
| **Bob Smith** | `bob@example.com` | `Password123!` | Editor on "Architecture Specs", Owner of "Q4 Goals" |
| **Charlie Zhang** | `charlie@example.com` | `Password123!` | Available user to invite as collaborator |

> **Tip for Reviewer**: The app features a **1-click account switcher** in the top navbar. You can toggle between Alice and Bob instantly with zero password typing to test permission differences!

---

## 🧪 Testing Instructions

Run the automated integration test suite covering health checks, authentication, authorization, role enforcement, and file import:
```bash
# Run backend integration tests
npm test
```
*Expected Result*: 17 passed tests.

To verify production compilation:
```bash
# Build both server and client production artifacts
npm run build
```

---

## 📋 Reviewer Verification Walkthrough

Follow this step-by-step checklist to test all core requirements:

### Step 1: Login & Document Listing
1. Open [http://localhost:5173](http://localhost:5173). You will automatically be authenticated as **Alice**.
2. Notice the **MongoDB Atlas Connected** status pill in the navbar.
3. In the dashboard, observe:
   - "All Docs", "Owned by Me", and "Shared with Me" filter tabs.
   - Live search bar filtering by document title or owner name.
   - Grid and List layout toggles.

### Step 2: Rich Text Editing & Autosave
1. Click **"+ New Document"** or open *"Product Strategy & Vision 2026"*.
2. Test rich text formatting on the toolbar:
   - **Bold** (`Ctrl+B` / `Cmd+B`)
   - **Italic** (`Ctrl+I` / `Cmd+I`)
   - **Underline** (`Ctrl+U` / `Cmd+U`)
   - **Headings** (H1, H2, H3, Paragraph)
   - **Lists** (Bulleted list, Numbered list)
   - **Blockquotes** and **Horizontal Rules**
   - **Undo / Redo** (`Ctrl+Z`, `Ctrl+Y`)
3. Watch the save status pill in the top header transition seamlessly:
   - `Unsaved changes` $\to$ `Saving...` $\to$ `Saved`.
4. Press `Cmd+S` or click **"Save"** for immediate manual flush.

### Step 3: Granular Permissions (Owner vs Editor vs Viewer)
1. In the top navbar, click the **Demo Switcher** and select **Bob**.
2. Bob opens *"Architecture & Technical Specifications"* (where Alice assigned Bob the **Editor** role):
   - Notice the blue **"Editor"** pill.
   - Bob can edit text, add headings, and save changes.
   - Bob *cannot* delete the document or remove the owner.
3. Bob switches to Alice's view: Alice opens *"Q4 Team Goals & KPIs"* (where Bob assigned Alice the **Viewer** role):
   - Notice the amber **"Viewer (Read Only)"** pill.
   - The editor toolbar is locked with an informative banner.
   - Any manual or intercepted modification is blocked **server-side** with `HTTP 403 Forbidden`.

### Step 4: File Import & Export
1. Click **"Import .md / .txt"** in the sidebar or dashboard.
2. Select or drag any `.md` or `.txt` file ($\le$ 1MB).
3. The parser translates Markdown `# Headings`, lists, and bold text into structured TipTap nodes safely without raw HTML injection.
4. Click **"Export"** in the editor header to download as:
   - **Markdown (`.md`)**
   - **Plain Text (`.txt`)**
   - **TipTap JSON (`.json`)**

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, TipTap Editor (`StarterKit`, `Underline`, `Placeholder`), Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, Mongoose ODM, Zod validation, bcryptjs, jsonwebtoken, cors.
- **Database**: MongoDB (Atlas or local instance) with indexed collections on `owner`, `collaborators.user`, and `updatedAt`.
- **Testing**: Vitest and Supertest.

Detailed architecture diagrams, data schemas, and explicit tradeoffs are documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 🌐 Production Deployment Guide

### Deploying Frontend to Vercel
1. Push the repository to GitHub.
2. In Vercel, click **"Add New Project"** and import the repository.
3. Configure the project:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: URL of your deployed Render backend (e.g., `https://collabdocs-api.onrender.com`).
4. Click **Deploy**. SPA routing is handled by [`client/vercel.json`](./client/vercel.json).

### Deploying Backend to Render
1. In the Render Dashboard, click **New +** $\to$ **Web Service** (or use Blueprint with [`render.yaml`](./render.yaml)).
2. Configure settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `10000`
     - `MONGODB_URI`: Your MongoDB Atlas connection string.
     - `JWT_SECRET`: Random 32+ character secret string.
     - `CORS_ORIGIN`: Your Vercel frontend domain (e.g., `https://collabdocs.vercel.app`).
3. Click **Deploy Web Service**.

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `Database Warning: MongoDB is disconnected` | `MONGODB_URI` unreachable or MongoDB server stopped | Verify local `mongod` is running on 27017 or provide valid MongoDB Atlas connection string in `server/.env`. |
| `EADDRINUSE: port 5002 in use` | Another process is using port 5002 | Change `PORT` in `server/.env` and update `VITE_API_URL` in `client/.env`. |
| `Unsupported file type on import` | File has an unsupported extension | File import accepts `.md`, `.markdown`, and `.txt` files up to 1 MB. |

# CollabDocs
