# NRZONE PRO - Global Intelligence & ERP

## Industrial ERP Solution for Garment Manufacturing

Welcome to the **NRZONE PRO** version 2.4.0. This system is designed for high-performance tracking of production workflows, material logistics, and financial audits.

---

## 🚀 Core Technologies

- **Frontend**: React + Vite (High-Performance build)
- **Styling**: Vanilla CSS + Tailwind CSS (Premium "White Mood" Aesthetics)
- **Database / Cloud**: Firebase Firestore (Real-time synchronization)
- **Storage**: Firebase Storage (Design assets & images)
- **Logistics**: Google Sheets Integration (via Google Apps Script)

---

## 🛠️ Quick Setup (Local Environment)

### 1. Installation

Ensure you have **Node.js** installed. Run the following in your terminal:

```bash
npm install
```

### 2. Environment Configuration

The system uses a `.env` file for secure credential management. Ensure it contains the following keys (already pre-configured for your active accounts):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_SUPABASE_URL` (Legacy / Backup)
- `VITE_SUPABASE_KEY` (Legacy / Backup)

### 3. Execution

```bash
npm run dev
```

Access the terminal at **`http://localhost:5173`** (Default Vite port).

---

## 📦 Deployment Hub (Vercel)

The project is pre-configured for **Vercel Deployment**.

1. **Push code** to your GitHub repository.
2. **Connect to Vercel**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - **Important**: Add all `.env` variables in Vercel Project Settings -> Environment Variables.

---

## 📁 System Architecture

- `src/components/panels/`: Centralized manufacturing modules (Cutting, Pata, Factory, etc.)
- `src/hooks/useMasterData.js`: Central state engine (Local + Cloud sync Every 5s)
- `src/utils/syncUtils.js`: Real-time logging to External Auditor (Google Sheets)
- `src/utils/calculations.js`: Inventory & Stock logic engine.

---

## 🛡️ Access Credentials

- **Super Admin**: `NRZONE` / `Irham@#`
- **Manager**: `MANAGER` / `456`

---
**Developed & Optimized by Antigravity AI**
*v2.4.0 | Industrial Grade | "White Mood" Active*
