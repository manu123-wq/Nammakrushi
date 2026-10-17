# 🌾 NammaKrushi Full-Stack Architecture Guide
## MERN Stack + SQLite + SQLAlchemy MVC Structure

This project has been engineered with a dual-execution MVC architecture:
1. **Full-Stack MERN Stack (Node.js + Express + React + SQLite)**: Runs out of the box with zero setup in browser and Visual Studio.
2. **Python SQLAlchemy Backend (Flask + SQLAlchemy + SQLite)**: Provided in `/backend` for Python / Visual Studio developers.
Both backends share the same **SQLite database** (`nammakrushi.sqlite`) and expose identical REST API routes!

---

### 📂 MVC Directory Structure

```
├── nammakrushi.sqlite          # Shared SQLite database file
├── server.ts                   # Express server entry point (MERN Stack)
├── src/
│   ├── components/             # React View Layer (Dashboard, Marketplace, PurchaseHistory, MarketRates, etc.)
│   ├── server/                 # Node.js MVC Backend Layer
│   │   ├── database/
│   │   │   ├── sqlite.ts       # Native SQLite engine & schema initialization
│   │   │   └── sqlalchemy_orm.ts # Declarative ORM adapter (SQLAlchemy style)
│   │   ├── models/             # Data Models & Schemas
│   │   │   ├── ProductModel.ts
│   │   │   ├── OrderModel.ts
│   │   │   ├── TraceabilityModel.ts
│   │   │   └── MarketRateModel.ts
│   │   ├── controllers/        # Business Logic Controllers
│   │   │   ├── productController.ts
│   │   │   ├── orderController.ts
│   │   │   ├── traceabilityController.ts
│   │   │   └── marketRateController.ts
│   │   └── routes/             # RESTful Routes Dispatcher
│   │       └── index.ts
├── backend/                    # Python SQLAlchemy Backend (Optional for VS Code / Python lovers)
│   ├── database.py             # SQLAlchemy Engine & SessionLocal
│   ├── models.py               # Declarative Base SQLAlchemy models
│   ├── controllers.py          # SQLAlchemy Session MVC Controllers
│   ├── app.py                  # Flask REST API server
│   └── requirements.txt
```

---

### 🚀 Running in VS Studio / Visual Studio Code

#### Option A: Run Full-Stack MERN (Recommended)
1. Open the project folder in VS Code / Visual Studio.
2. In the terminal:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

#### Option B: Run Python SQLAlchemy Backend (Alternative)
1. In the VS Code terminal:
   ```bash
   pip install -r backend/requirements.txt
   python -m backend.app
   ```
2. The SQLAlchemy REST API will run on `http://localhost:5000`.

---

### 🌐 Browser-Based Routes

| Browser Route | View / Component | Description |
|---|---|---|
| `/` or `/marketplace` | `Marketplace` | Direct Farm-to-Consumer Produce Store (Price in kg) |
| `/purchase-history` | `PurchaseHistory` | 1-Click Reorder, Live Tracking, & Farm-to-Table QR |
| `/market-rates` | `MarketRates` | APMC Mandi Rates & 30-Day Trend Chart |
| `/dashboard` | `Dashboard` | Climate-smart farm dashboard & yield stats |
| `/inventory` | `InventoryManager` | Farmer inventory tracking |
| `/tasks` | `TaskTracker` | Field task scheduling & alerts |
| `/advisor` | `CropPredictor` | AI Soil & crop suitability engine |
| `/chatbot` | `Chatbot` | Gemini AI Agronomist Chatbot |

---

### 🔌 REST API Endpoints (SQLite & SQLAlchemy)

- `GET /api/products` - List all products (with `?category=` and `?farmerOnly=true` filters)
- `POST /api/products` - Create new farm produce listing
- `GET /api/products/:id` - Get specific product details
- `GET /api/orders` - List consumer orders with items and tracking logs
- `POST /api/orders` - Submit new order with payment gateway confirmation
- `GET /api/orders/:id` - Fetch single order
- `POST /api/orders/rate` - Submit star rating & consumer review
- `GET /api/traceability/:id` - Fetch Farm-to-Table QR code passport and transport logs
- `POST /api/traceability/verify` - Verify digital farm passport hash
- `GET /api/market_rates` - Mandi APMC live benchmark prices
