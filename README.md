# 🌾 NammaKrushi (ನಮ್ಮ ಕೃಷಿ)
### AI-Powered Climate-Smart Farm Management & Direct-to-Consumer Produce Marketplace

Built with **React 19**, **Node.js**, **Express**, **SQLite**, and **Google Gemini AI**. Structured with a clean **MVC (Model-View-Controller)** pattern and **SQLAlchemy** declarative models.

---

## ⚡ Quick Start in VS Code (Visual Studio Code)

### Prerequisites
* **Node.js** version 18, 20, or 22+ installed on your computer ([Download Node.js](https://nodejs.org/)).
* **VS Code** ([Download Visual Studio Code](https://code.visualstudio.com/)).

---

### Step 1: Open the Project in VS Code
1. Open **Visual Studio Code**.
2. Click **File** > **Open Folder...** (or `Ctrl+K Ctrl+O` on Windows / `Cmd+O` on macOS).
3. Select this project root folder (the folder containing `package.json`).

---

### Step 2: Open the Integrated Terminal
* Press `` Ctrl + ` `` (backtick) or go to menu **Terminal** > **New Terminal**.

---

### Step 3: Install Node Dependencies
In the terminal, run:
```bash
npm install
```
*(This installs React, Vite, Express, Lucide icons, Recharts, and TypeScript types).*

---

### Step 4: Environment Variables (Optional)
If you want to use the Gemini AI agronomy chat and voice transcription locally:
1. Make a copy of `.env.example` and name it `.env`:
   ```bash
   cp .env.example .env
   ```
2. Put your free Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY="your-api-key-here"
   ```
*(Get a free API key at [aistudio.google.com](https://aistudio.google.com/app/apikey)).*

---

### Step 5: Run the Application

#### Option A: One-Click Launch in VS Code (Easiest)
1. Press **`F5`** on your keyboard (or click the **Run and Debug** icon on the left sidebar).
2. Select **`🚀 Run Full-Stack MERN App (Node.js + React + SQLite)`** and press Enter.

#### Option B: Terminal Command
In the VS Code terminal, run:
```bash
npm run dev
```

---

### Step 6: View in Browser
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🌐 Browser Routes

You can navigate directly to any route in your browser address bar:

| Route URL | View / Page | Key Features |
|---|---|---|
| `http://localhost:3000/marketplace` | **Produce Marketplace** | Direct farmer produce priced in kg, real-time quantity steppers, cart, & 1-click buy |
| `http://localhost:3000/purchase-history` | **Purchase History** | 1-Click reorder basket, live farm transit milestones, digital invoice, & **Farm-to-Table QR** passport |
| `http://localhost:3000/market-rates` | **APMC Mandi Rates** | Live APMC mandi benchmarks & 30-day interactive price trend graph powered by Recharts |
| `http://localhost:3000/dashboard` | **Farmer Dashboard** | Agro-climatic weather advisories, farm yield tracking, and field tasks |
| `http://localhost:3000/inventory` | **Smart Inventory** | Warehouse stock management with 1-click publishing to marketplace |
| `http://localhost:3000/tasks` | **Task Schedule** | Field activity timeline & alerts |
| `http://localhost:3000/chatbot` | **Gemini Agronomist** | Multi-turn agricultural chatbot with regional agronomy prompts |
| `http://localhost:3000/predict` | **Crop Predictor** | N-P-K soil and rainfall crop suitability algorithms |

---

## 🗄️ SQLite Database & MVC Structure

The application comes bundled with a local SQLite database: **`nammakrushi.sqlite`**.
* **Zero Database Setup**: No PostgreSQL or MySQL server installation required. Node 22 native `DatabaseSync` connects directly to `nammakrushi.sqlite`.
* **Automatic Schema & Seeding**: Tables (`products`, `orders`, `traceability`, `market_rates`) are automatically created and seeded on initial boot.

### Project Layout
```
├── nammakrushi.sqlite          # SQLite database file (auto-initialized)
├── server.ts                   # Express server entry point
├── .vscode/                    # VS Code launch & task configurations
│   ├── launch.json             # F5 1-Click debug launch configuration
│   └── tasks.json              # VS Code npm tasks
├── src/
│   ├── components/             # React View components
│   ├── server/                 # MVC Backend
│   │   ├── database/
│   │   │   ├── sqlite.ts       # Native SQLite database engine & schema
│   │   │   └── sqlalchemy_orm.ts # SQLAlchemy-style declarative ORM layer
│   │   ├── models/             # Data Models (ProductModel, OrderModel, TraceabilityModel, MarketRateModel)
│   │   ├── controllers/        # Business Logic Controllers
│   │   └── routes/             # REST API Route Dispatcher (/api/*)
└── backend/                    # Python SQLAlchemy Backend (Optional alternative)
    ├── database.py             # SQLAlchemy 2.0 Engine & Session
    ├── models.py               # SQLAlchemy Declarative Models
    ├── controllers.py          # SQLAlchemy Session Controllers
    └── app.py                  # Flask REST Server
```

---

## 🐍 Optional: Running with Python SQLAlchemy Backend
If you prefer running the backend using Python & SQLAlchemy:
1. Open a terminal in VS Code:
   ```bash
   pip install -r backend/requirements.txt
   python -m backend.app
   ```
2. The SQLAlchemy REST API will start on `http://localhost:5000`.

---

## 🛠️ Useful VS Code Commands

| Task | Command |
|---|---|
| Start Dev Server | `npm run dev` |
| Build for Production | `npm run build` |
| Run Standalone Express Server | `npm start` |
| Type Check / Lint | `npm run lint` |
| Inspect SQLite API | Open `http://localhost:3000/api/health` |
