# DigiExam 🛡️📝

**DigiExam** is a secure, intelligent, and tamper-proof examination platform built for rigorous testing environments. By combining modern web architectures, Artificial Intelligence, and Blockchain technology, DigiExam provides a seamless interface for administrators and candidates while guaranteeing transparency and data integrity.

---

## 🌟 Key Features

### 🎓 1. Dual-Role Dashboards
- **Administrators**: Create and schedule exams, bulk-import questions via documents, control session terminations, and monitor analytical dashboards.
- **Candidates (Cadets)**: Access customized dashboards showing upcoming examinations, historical attempts, and performance breakdowns. Now wrapped in **React Suspense** for optimized Vercel builds and faster page transitions.

### 🧠 2. AI-Optimized Feedback (Gemini 2.5 Flash)
- **Pre-Generated Explanations**: To eliminate real-time grading latency, the AI now analyzes and generates detailed explanations for every option *during* the question upload process.
- **Instant Analysis**: Candidates receive immediate, high-quality reasoning for wrong answers directly from the database, eliminating wait times during result reviews.

### 🛑 3. Advanced Anti-Cheat & Passive Proctoring
- **Strict Lockdown**: Intercepts and blocks keyboard shortcuts (Ctrl+C, Alt+Tab, etc.), disables right-click context menus, and prevents text selection.
- **Environment Monitoring**: Detects when the mouse exits the viewport or when Developer Tools are opened (via window dimension delta tracking), issuing immediate security strikes.
- **Question Randomization**: Implements Fisher-Yates shuffling on both question and option order per cadet at start-time, preventing answer-key leakage.

### ✉️ 4. Automated Notifications
- **Email System**: Integrated **Nodemailer** to automatically dispatch secure result summaries, performance reports, and violation warnings directly to cadet inboxes upon exam completion.

---

## 🌐 Hybrid Storage Infrastructure (MongoDB + Web3)

### 💿 Primary Storage: MongoDB Atlas & Audit Logs
- **Audit Trails**: Every admin action (Exam creation, Question edits, etc.) is now logged in a dedicated `AuditLog` collection, tracking the "Who, What, and When" for full accountability.
- **Analytical Data**: Stores shuffles, AI explanations, and detailed attempt histories.

### ⛓️ Immutable Ledger: Polygon L2 (Hardened Web3)
We have upgraded the blockchain layer from a simple counter to a cryptographic security hub using **OpenZeppelin** standards.
- **On-Chain Result Hashing**: Each exam result is hashed (SHA-256) and anchored to the Polygon network. This prevents "Database Forgery"—if a score is altered in MongoDB, it will no longer match the on-chain hash.
- **Soulbound NFT Certificates (SBNC)**: Candidates who pass receive non-transferable ERC-721 "Soulbound" tokens as permanent, verifiable credentials on the blockchain.
- **Immutable Violation Logging**: Security strikes are emitted as permanent blockchain events, ensuring a cadet's disciplinary record cannot be silently wiped.
- **RBAC (Role Based Access Control)**: On-chain permissions ensure only the authorized API server can commit results or mint certificates.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16.1 (App Router, Turbopack, Suspense Boundaries)
- **AI Integration**: Google Gemini 2.5 Flash
- **Web3 Layer**: Ethers.js v6, Hardhat, OpenZeppelin, Polygon L2
- **Notification**: Nodemailer (SMTP)
- **Deployment**: Vercel (Optimized with `vercel.json` rewrites)

---

## 📦 Required Node Modules

### 🖥️ High-Level Application (`/app`)
| Module | Purpose |
| :--- | :--- |
| `ethers` | Blockchain interaction & Result anchoring |
| `nodemailer` | SMTP automated result delivery |
| `@google/generative-ai` | Gemini 2.5 Flash inference |
| `mongoose` | MongoDB object modeling |
| `jsonwebtoken` | Secure session management (JWT) |
| `bcryptjs` | Password hashing & security |
| `lucide-react` | Modern iconography |
| `sonner` | Toast notifications |

### ⛓️ Web3 & Polygon Logic (`/web3`)
| Module | Purpose |
| :--- | :--- |
| `hardhat` | Development & Deployment environment |
| `@nomicfoundation/hardhat-toolbox` | Swiss-army knife for Smart Contracts |
| `@openzeppelin/contracts` | Industry-standard ERC-721 & RBAC templates |
| `dotenv` | Safe handling of Private Keys/RPC URLs |

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
cd web3
npm install
```

### 2. Environment Variables (`.env.local`)
```env
# Database & Auth
MONGODB_URI="mongodb+srv://..."
JWT_SECRET="your_secret"

# AI & Email
GEMINI_API_KEY="AIzaSy..."
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"

# Web3
WEB3_RPC_URL="polygon_rpc_url"
WEB3_PRIVATE_KEY="server_wallet_key"
CONTRACT_ADDRESS="deployed_contract_addr"
```

### 3. Deploy Contract
```bash
cd web3
npm run deploy
```

### 4. Run
```bash
npm run dev
```

*Designed for absolute accountability, transparency, and high-performance proctoring.*
