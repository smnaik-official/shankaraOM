# shankaraOM — Business & Invoice Management System

A full-stack business administrative platform featuring automated invoicing, client ledgers, recurring retainers, compliance tracking, expense management, ad spend ledger, and centralized cloud database synchronization via MongoDB Atlas.

---

## 📁 Clean Repository Architecture (Client vs Server Separation)

The codebase is organized into decoupled **Client** and **Server** domains orchestrated via npm workspaces:

```
invoice-admin-panel/
├── client/                     # 🌐 Frontend React Application
│   ├── public/                 # Static public assets (logos, signatures, QR codes)
│   ├── src/                    # React UI & Business Logic
│   │   ├── assets/             # Brand logos & letterheads
│   │   ├── components/         # Modular dashboard views, cards & tables
│   │   ├── data/               # Local seed data, schemas & models
│   │   ├── layouts/            # Sidebar navigation, top header & shell
│   │   ├── services/           # API client with Atlas sync & offline cache
│   │   ├── utils/              # PDF generator, JWT auth, date formatters
│   │   ├── App.tsx             # Root router & protected view switch
│   │   ├── index.css           # Tailwind custom styling & fonts
│   │   └── main.tsx            # React DOM mounting
│   ├── index.html              # HTML5 entrypoint & font links
│   ├── package.json            # Client-specific dependencies (React, Recharts, Lucide, etc.)
│   ├── postcss.config.js       # PostCSS plugins
│   ├── tailwind.config.js      # Shankara brand colors, typography & layout theme
│   ├── tsconfig.json           # Client TypeScript configuration
│   └── vite.config.ts          # Vite bundler config & /api proxy to server
│
├── server/                     # ⚙️ Backend API & MongoDB Atlas
│   ├── .env                    # Cloud credentials & PORT (git-ignored)
│   ├── .env.example            # Environment variables template
│   ├── index.js                # Express REST API, MongoDB connection & CRUD routes
│   ├── package.json            # Server-specific dependencies (Express, MongoDB, CORS, Dotenv)
│   ├── seedData.js             # Initial bootstrap dataset for 11 collections
│   └── testConnection.js       # Standalone MongoDB Atlas connectivity test script
│
├── .gitignore                  # Clean repository ignores (node_modules, dist, .env)
├── package.json                # Root coordinator with npm workspaces & scripts
└── README.md                   # Project documentation & guidelines
```

---

## 🚀 Quick Start & Development

### 1. Install Dependencies
Run the install command at the root to install both client and server packages:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template and verify the MongoDB Atlas connection:
```bash
cp server/.env.example server/.env
```
Default connection string:
```
PORT=5000
MONGODB_URI=mongodb+srv://mail4mnaik_db_user:Vai104aCUFhuHmaB@shankaraom.2nepkoh.mongodb.net/shankara_admin_db?retryWrites=true&w=majority
DB_NAME=shankara_admin_db
```

### 3. Run Development Servers
You can run both Client and Server concurrently with a single command from root:
```bash
npm run dev
```

Alternatively, run each service independently:
- **Client (Frontend)**:
  ```bash
  npm run client
  # Runs Vite dev server at http://localhost:5173
  ```
- **Server (Backend)**:
  ```bash
  npm run server
  # Runs Express MongoDB API at http://localhost:5000
  ```

---

## 🛠️ Available Root Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both backend Express server and Vite frontend concurrently |
| `npm run client` | Starts only the Vite client development server |
| `npm run server` | Starts only the Express Node.js MongoDB Atlas server |
| `npm run build` | Compiles TypeScript and builds the production bundle in `client/dist/` |
| `npm run preview`| Previews the production build locally |
| `npm run lint` | Runs ESLint over client TypeScript and JSX files |

---

## 🔐 Authentication Credentials
The admin panel is protected with JWT token authentication:
- **Username**: `Naik-ShankaraOnline`
- **Password**: `ssrs**513JGD`

---

## ☁️ Centralized MongoDB Database

The backend connects directly to MongoDB Atlas cluster `shankaraom.2nepkoh.mongodb.net` and manages the following collections:
- `invoices`: Client invoices (Company & Personal) with GST, SAC, items & PDF generation.
- `recurring_templates`: Monthly retainers and recurring automation schedules.
- `credit_notes`: Credit notes and adjustments.
- `clients`: Complete client directory, GSTINs, and billing contacts.
- `expenses`: Categorized operating expenditures.
- `subscriptions`: Software tools, renewals, and billing frequencies.
- `compliances`: Statutory deadlines (TDS, GSTR-1, GSTR-3B, PT).
- `billing_profiles`: M/s Shankara Online Solutions LLP banking details and authorized signatures.
- `employees`: Staff salary records and payslip data.
- `ad_ledger`: Client ad spend tracking, campaign budgets, and agency margins.
- `proposals`: Quotes and business proposals.
