# NeuraMind

**AI-Assisted UI Generation from Wireframe, Code & Prompt**

> SIH Hackathon Project | MillenForge Team

NeuraMind converts wireframe sketches, natural language prompts, and existing code into production-ready UI components using AI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 + PrimeReact |
| State | Redux Toolkit |
| Routing | react-router-dom v7 |
| Backend | Node.js + Express |
| Uploads | Multer |
| Database | MongoDB (Mongoose) |
| HTTP Client | Axios |

---

## Project Structure

```
MillenForge/
├── frontend/          # React + Vite application
│   └── src/
│       ├── components/    # Reusable UI components (NmButton, NmCard, NmInput, NmUploadArea, etc.)
│       ├── pages/         # Route-level pages (GeneratePage, PreviewPage)
│       ├── features/      # Redux slices (generation, ui, pages)
│       ├── store/         # Redux store configuration
│       ├── services/      # Centralized API service layer (api.js)
│       ├── types/         # Shared UI data contract (ui.js)
│       ├── hooks/         # Custom React hooks (useApi)
│       └── utils/         # Helper functions
│
├── backend/           # Express REST API
│   ├── src/
│   │   ├── routes/        # Route definitions
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic (db.js, aiService.js)
│   │   ├── middleware/     # Express middleware (upload.js, errorHandler.js)
│   │   ├── utils/         # Response helpers
│   │   └── types/         # JSDoc type definitions
│   └── uploads/           # Wireframe image storage (local dev)
│
├── package.json       # Root scripts
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9
- MongoDB (optional — app starts without it in dev)

### 1. Clone & Install

```bash
# Install all dependencies
npm run install:all
```

Or install separately:

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and set MONGODB_URI if using MongoDB

# Frontend (optional — Vite proxies /api to localhost:5000 in dev)
cp frontend/.env.example frontend/.env
```

### 3. Start Development Servers

```bash
# Terminal 1 — Frontend (http://localhost:5173)
npm run dev:frontend

# Terminal 2 — Backend (http://localhost:5000)
npm run dev:backend
```

---

## API Endpoints

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/api/health` | ✅ Implemented | Health check + DB + AI status |
| POST | `/api/upload` | ✅ Implemented | Wireframe image upload (Multer) |
| POST | `/api/generate` | ✅ Implemented | Gemini Vision UI generation |
| GET | `/api/pages` | ✅ Implemented | List all generated pages |
| GET | `/api/pages/:pageName` | ✅ Implemented | Get page schema by pageName |

---

## Frontend Routes

| Path | Component | Description |
|---|---|---|
| `/` | Redirect | Redirects to `/generate` |
| `/generate` | GeneratePage | Wireframe upload + prompt + code inputs |
| `/preview/:pageName` | PreviewPage | Preview generated UI |

---

## Environment Variables

### Backend (`backend/.env`)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neuramind
AI_API_KEY=                   # Future LLM/Vision API key
AI_API_BASE_URL=              # Future AI service URL
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=                 # Optional — defaults to /api (proxied)
```

---

## UI Data Contract

The shared data model for generated pages:

```json
{
  "page": "Home",
  "sections": [
    {
      "id": "hero-01",
      "type": "hero",
      "elements": [
        {
          "id": "hero-title",
          "type": "text",
          "content": "Build Faster with AI",
          "fallback": "Build Faster"
        }
      ]
    }
  ]
}
```

See [`frontend/src/types/ui.js`](frontend/src/types/ui.js) and [`backend/src/types/ui.js`](backend/src/types/ui.js) for the full schema.

---

## Contributing

This repository is worked on by multiple developers. Please follow these rules:

- **Do not rename major folders** — other modules depend on the structure
- **Do not modify API contracts** once published
- **Keep changes additive** — prefer extending over replacing
- **Never commit `.env`** files
- **Use the centralized API service** (`frontend/src/services/api.js`) — no direct fetch/axios in components

---

## Deployment & Production Readiness

### Local Development
- **Frontend**: Vite dev server (`http://localhost:5173`)
- **Backend**: Express REST API (`http://localhost:5000`)
- **MongoDB**: Optional — system runs with graceful fallback if database is offline or unconfigured.
- **Uploads**: Saved locally to `backend/uploads` and served statically.

### Production Readiness
- **Frontend Target**: Vercel / Netlify / static web host
- **Backend Target**: Node.js hosting platform (e.g., Render, Railway, Vercel Serverless)
- **Required Environment Variables**:
  - `AI_API_KEY`: Google Gemini API key
  - `MONGODB_URI`: Hosted MongoDB connection string (e.g., MongoDB Atlas)
  - `PORT`: Server port
  - `CLIENT_URL`: Production frontend URL for CORS configuration
- **Filesystem Warning**: Vercel and serverless platforms have ephemeral filesystems. Local `/uploads` storage is supported for event-day local execution; persistent production storage will require object storage when migrating off local servers.

> [!NOTE]
> Production deployment configuration has been hardened and validated locally. Remote production deployment is pending host provisioning.

---

*NeuraMind — Foundation v1.0 | SIH Hackathon*

