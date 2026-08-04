# AI Support Ticket Tracker

A complete, production-ready, beautiful Support Ticket Tracker web application built using a Clean Architecture Python/FastAPI backend and a React/TypeScript/Tailwind CSS frontend. It features mock authentication, status transition checks, detailed status audit logs, and a Gemini-powered AI ticket copilot.

---

## Key Features

1. **Clean Architecture Backend**: Decoupled layers (Router, Service, Repository, Database Model, Schema) following SOLID principles.
2. **SaaS Dashboard Frontend**: Responsive React + TypeScript dashboard with soft shadows, custom loaders, pagination-ready table, toast notifications, and modal triggers.
3. **Role-Based Workflows**:
   - **Agents** (John, Sarah): View only assigned tickets, progress ticket status (`New` → `In Progress` → `Resolved`), and access AI insights. Reassignment and reopen features are restricted.
   - **Managers** (David): Oversee all tickets, create and assign tickets, reassign tickets, reopen resolved tickets, and browse audit histories.
4. **AI Support Copilot**: Integrates the Gemini API key to deliver auto-summarization, sentiment classification, categories/tags, and professional reply suggestions. Includes a robust mock fallback if no API key is provided.
5. **Activity Log Timeline**: Every status update automatically appends an audit history entry containing the transition status, the performing user, and a timestamp.

---

## Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **API Client**: Axios (configured with request interceptors for mock headers)
- **State Management & Fetching**: React Context, TanStack Query (React Query)
- **Forms & Validation**: React Hook Form + Zod
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.10+
- **ORM / Database**: SQLAlchemy (Async Engine) + SQLite (`aiosqlite`)
- **Validation**: Pydantic v2
- **Server**: Uvicorn

---

## Project Structure

```
support-ticket-tracker/
│
├── frontend/                     # React Vite Application
│   ├── src/
│   │   ├── components/           # Reusable components (Button, Card, Modal, Table...)
│   │   ├── context/              # Authentication and Toast Contexts
│   │   ├── layouts/              # Main layout wraps (Sidebar + Top Navbar)
│   │   ├── pages/                # Login, Dashboard, and TicketDetails pages
│   │   ├── services/             # Axios API instance and endpoints
│   │   ├── types/                # TypeScript interface declarations
│   │   ├── App.tsx               # Main client routing
│   │   └── main.tsx              # React mounting root
│   ├── tailwind.config.js        # Tailwind settings
│   ├── postcss.config.js         # PostCSS plugins
│   └── package.json              # NPM dependencies
│
├── backend/                      # FastAPI Application
│   ├── app/
│   │   ├── config/               # App configuration & environment loaders
│   │   ├── database/             # SQLAlchemy engine & session generators
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic schemas for request/response validation
│   │   ├── repositories/         # Database query wrappers (Repository pattern)
│   │   ├── services/             # Core business logic and validations
│   │   ├── routers/              # API router endpoints
│   │   └── main.py               # Main entrypoint and startup seeds
│   ├── requirements.txt          # Python package requirements
│   └── .env                      # Backend local environment keys
│
├── .env                          # Root level environment file
├── .env.example                  # Environmental keys template
└── README.md                     # Setup instructions & developer documentation
```

---

## Setup & Running Guide

### 1. Root Configurations
Initialize configuration template.
```bash
cp backend/.env.example .env
```
Fill in the `GEMINI_API_KEY` with your Google Gemini API Key inside `.env` to enable the AI Insights features:
```env
GEMINI_API_KEY=AIzaSy...
```
*(If left blank, the app will gracefully fall back to mock AI summaries without crashing).*

---

### 2. Backend Setup
Activate your Python environment and install backend dependencies:

1. **Navigate to backend and install**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. **Start the FastAPI server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
The backend API is now running locally on [http://localhost:8000](http://localhost:8000) and will auto-generate the SQLite database (`support_tickets.db`) and seed mock users:
- **John** (ID: 1, Role: Agent)
- **Sarah** (ID: 2, Role: Agent)
- **David** (ID: 3, Role: Manager)

---

### 3. Frontend Setup
Install frontend packages and start the Vite development server:

1. **Navigate to frontend**:
   ```bash
   cd frontend
   ```
2. **Install node dependencies**:
   ```bash
   npm install
   ```
3. **Start the local development server**:
   ```bash
   npm run dev
   ```
The client app is now running locally on [http://localhost:5173](http://localhost:5173).

---

## User Credentials for Mock Login

On launching the frontend, select a user from the selection grid to enter the workspace:

| ID | Name  | Role    | Permissions Summary |
|---|---|---|---|
| **1** | John  | Agent   | Progress assigned tickets. Reopen & reassignment restricted. |
| **2** | Sarah | Agent   | Progress assigned tickets. Reopen & reassignment restricted. |
| **3** | David | Manager | Complete CRUD, reassignments, reopening tickets, full history logs. |
