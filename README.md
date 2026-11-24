# AutoSync 🛺⚡

> **Hyper-Local Smart Mobility Platform for College Campuses**
> Coordinate shared auto-rickshaw and cab commutes from transit hubs (Metro stations & Bus depots) to campus with atomic seat limits, dynamic UPI settlement, and RTO compliance.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/vkvarun719/Autosync)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvkvarun719%2FAutosync)

---

## ⚡ Deploying the Backend on Render (Render.com)

Render provides dedicated Linux web services with native Node.js support and writable persistent environments.

### Option 1: 1-Click Blueprint Deploy
Click the **[Deploy to Render](https://render.com/deploy?repo=https://github.com/vkvarun719/Autosync)** button above. Render reads the included [`render.yaml`](./render.yaml) automatically and provisions:
- **Service Name:** `autosync-backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start` (binds to `0.0.0.0:$PORT`)
- **Health Check Path:** `/api/hubs`

### Option 2: Manual Web Service in your Render Dashboard
If you are already in the Render Dashboard (`dashboard.render.com`):
1. Click **New +** ➡️ **Web Service**.
2. Connect your GitHub repository: **`vkvarun719/Autosync`**.
3. Configure the following fields:
   - **Name:** `autosync-backend` (or `autosync`)
   - **Region:** Any (e.g. *Oregon (US West)* or *Frankfurt (EU)*)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Plan:** `Free`
4. Click **Create Web Service**.
5. Once deployment is live, your backend and full API endpoints will be accessible at:
   `https://<your-service-name>.onrender.com/api/hubs`

> **CORS Enabled:** Cross-Origin Resource Sharing (CORS) is enabled across all `/api/*` endpoints. If you host your frontend on Vercel or locally, it can make direct API calls to your Render backend with zero CORS issues!

---

## 🚀 Instant Deployment to Vercel (Zero Config)

### 1-Click Web Deploy
1. Click the **[Deploy with Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvkvarun719%2FAutosync)** button above.
2. Select your GitHub account and click **Create**.
3. Vercel automatically runs `postinstall: prisma generate` and `next build`.
4. Your application will be live immediately with the bundled, pre-seeded campus transit hubs, drop-off gates, and demo student personas!

---

## 🌟 Core Features

### 1. 🎓 Institutional Auth & Safety Profile
- Validates institutional `.edu`, `.edu.in`, and `.ac.in` student domains.
- **1-Click Demo Personas** for multi-rider instant testing:
  - **Priya Sharma** (`CS2021001` - Female, CS 3rd Year, `priya@okicici`)
  - **Rahul Verma** (`EC2021042` - Male, ECE 3rd Year, `rahul@okhdfc`)
  - **Ananya Singh** (`ME2022015` - Female, Mech 2nd Year, `ananya@okaxis`)
- Safety profile with Roll ID, Gender, Default UPI ID, and Emergency Contact.

### 2. 📍 Geospatial Clustering & Priority Queue Matching
- Commuters select Pickup Hub, Campus Destination, Vehicle Type (`AUTO` or `CAB`), and optional `Women-Only Pool` filter.
- **Haversine Geospatial Clustering (300m radius)** automatically groups riders arriving at nearby gates.
- **Priority Queue Matching Engine** prioritizes the longest-waiting commuters within a 10-minute window.
- **Strict RTO Capacity Guardrails**:
  - `AUTO`: Max 3 passengers (strictly enforced atomically in transactions)
  - `CAB`: Max 4 passengers

### 3. ⏱️ Live Waiting Room & Coordination
- Interactive Leaflet map with OpenStreetMap tiles displaying pickup hubs, destination route, and active pools.
- Real-time polling every 3 seconds showing joined co-riders, avatar badges, and remaining seat slots.
- Live countdown timer for the 10-minute window.
- **Quick-Status Chips**: "At Gate 2", "Spotted an auto", "2 mins away", "Boarded auto", "At campus gate".
- **Simulate Another Student Joining Button**: Add simulated student riders with 1 click for solo testing.

### 4. 💸 Proportional Fare Splitting & Automated UPI Links
- First rider assigned automatically as **Ride Lead** (with option to transfer leadership).
- Choose **Equal Split** or **Proportional Split** (weighted by drop-off distance).
- Generates valid `upi://pay?pa={leadUpi}&pn={leadName}&am={shareAmount}&cu=INR&tn=AutoSync_{poolId}` deep links.
- Scannable QR code (`qrcode.react`) for each rider to pay directly via GPay, PhonePe, Paytm, or BHIM.
- "Mark as Paid" settlement tracker.

### 5. 🛡️ Safety & RTO Compliance Layer
- **Vehicle Number Plate Logger**: Log auto/cab registration plate (e.g., `DL 1R AB 4589`).
- **1-Tap SOS Emergency Trigger**: Immediate emergency dial (`112` and emergency contact) + live ride summary coordinates.
- **Copy Live Trip Share Link**: Shareable text with route, vehicle plate, and rider roll numbers.
- **RTO Compliance Notice**: Certified zero-commission peer-to-peer student carpooling utility.

---

## 🛠️ Tech Stack (Zero External API Keys Required)

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS (Haulix Logistics Dark Mode Theme)
- **Database**: SQLite via Prisma ORM (with Vercel serverless `/tmp` bridge & Render persistent support)
- **Maps**: Leaflet + OpenStreetMap CartoDB Dark Matter tiles (dynamic client import)
- **Payments**: Dynamic UPI Deep Links + `qrcode.react`
- **Icons**: `lucide-react`

---

## 💻 Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations & Seed (Already bundled in repo)
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 3. Start Local Server
```bash
npm run dev
# or for optimized production build:
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Multi-Rider Pooling
1. Open [http://localhost:3000](http://localhost:3000) and click **Priya Sharma (Demo Lead)**.
2. Select **Metro Station Gate 1** ➡️ **Main Campus Gate**, choose **Auto (3 seats)**, and click **Initiate Priority Commute Pool**.
3. Inside the Waiting Room, click **"SIMULATE ANOTHER STUDENT (SOLO TEST)"** to simulate co-riders joining.
4. Enter total driver fare (e.g. ₹90) and click **Generate Dynamic UPI QRs**.
5. Test logging the vehicle number plate, 1-Tap SOS trigger, or copying the Live Trip Share link.
