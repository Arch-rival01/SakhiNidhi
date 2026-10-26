# 🌾 SakhiNidhi (सखीनिधि)
> **Offline-First, Voice-Enabled Micro-Accounting Android APK & Web Platform for Tribal Self-Help Groups (SHGs)**  
> **Hackathon:** Tribe 2026 | **Theme:** Women-led Enterprises  
> **Target Region:** Jharkhand, India (East Singhbhum, Ranchi, Dumka)  
> **Operating Cost:** ₹0 (100% Free Tools & Open Source)

---

## 🌟 Overview & Low-Literacy Rural UX

SakhiNidhi is engineered specifically for tribal women Self-Help Group (SHG) treasurers and members with low digital literacy. Operating in remote rural areas with zero or unstable internet connectivity, it allows complete accounting, weekly meeting management, loan disbursals, and passbook generation right on basic Android smartphones.

### Low-Literacy UX Principles Built-In:
1. **Icon-First Design:** Every primary action has a prominent, easily recognizable SVG icon (coins = savings, hand with coin = loan, calendar = meeting, people = attendance, bar chart = reports).
2. **Accessible Tap Targets & Typography:** Minimum touch target **56x56px**, high WCAG AA contrast, clean proportional text hierarchy.
3. **One Screen, One Action:** Single primary action fixed at the bottom within comfortable thumb reach.
4. **Universal Voice Assistance:** Every screen features a speaker button that reads its purpose and key amounts aloud (`SpeechSynthesis` with `hi-IN`).
5. **Triple Confirmation Feedback:** Every financial transaction gives triple confirmation:
   - 🟢 Animated green tick mark
   - 🗣️ Spoken read-back (e.g. *"Sita Hansda, बचत 100 रुपये जमा हुए"*)
   - 📳 Tactile haptic vibration (`navigator.vibrate`)
6. **Voice Amount Entry + Hindi Number Parsing:** Web Speech recognition parses spoken Hindi amounts (*"sau" -> 100, "do sau" -> 200, "paanch sau" -> 500, "ek hazaar" -> 1000, "dedh sau" -> 150*) alongside an on-screen numeric keypad.
7. **Multi-Language Inclusion:** English, Hindi (हिन्दी), Santhali in Ol Chiki script (ᱥᱟᱱᱛᱟᱲᱤ), Ho (ᱦᱳ), and Mundari (ᱢᱩᱱᱰᱟᱨᱤ), rendered via Google Fonts (`Noto Sans Ol Chiki`, `Noto Sans Devanagari`).

---

## 🌐 Application Architecture & Routes

| Route | View | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `/` | **Public Project Website** | Landing page with Hero, About SakhiNidhi, tribal context, and direct APK download. | Public |
| `/download` | **APK Download Page** | Standalone download page with direct binary `.apk` download and phone QR code. | Public |
| `/app` | **SHG Micro-Accounting UI** | The core app interface packaged inside the Android APK (Meetings, Savings, Loans, Reports). | APK / In-Browser Preview |
| `/bank/:groupId` | **Bank Officer Dashboard** | Read-only portal with 8-week trend charts, loan portfolio donut, and verified audit badge. | **Hidden** (Direct URL / QR Only) |

---

## 🏗️ Tech Stack (₹0 Cost)

- **Frontend:** React 19, Vite, Tailwind CSS (Mobile-First responsive tokens)
- **Local Source of Truth (Offline):** Dexie.js (IndexedDB)
- **Mobile Packaging & OTA Updates:** `@capacitor/core`, `@capacitor/cli` (`capacitor.config.json`)
- **PWA & Offline Service Worker:** `vite-plugin-pwa` with precache & runtime Google Font caching
- **Internationalization:** `i18next` + `react-i18next`
- **Voice Synthesis & Input:** Web Speech API (hi-IN) + custom Hindi number parser
- **Reporting & Registers:** `jsPDF` + `jspdf-autotable` (Passbook, Cash Book, Loan Register, Attendance)
- **Data Visualizations:** `Chart.js` + `react-chartjs-2`
- **QR Code Generation:** `qrcode`
- **Icons & Micro-animations:** `lucide-react` (Zero emojis) + `framer-motion`
- **Testing Engine:** `vitest`

---

## 🚀 Quick Start (Local Setup)

```bash
# 1. Clone repository
git clone https://github.com/your-username/SakhiNidhi.git
cd SakhiNidhi

# 2. Install dependencies (Node 18+)
npm install

# 3. Run unit tests (Finance engine & Voice parser)
npm test

# 4. Start local development server
npm run dev

# 5. Build and preview installable PWA
npm run build
npm run preview
```

Open `http://localhost:5173` in your browser.

---

## 📊 Pre-Loaded Demo Data & Features

The app automatically seeds a realistic 3-month history for instant demonstration:
- **1 SHG:** *Sakhi Mandal, Jamshedpur block* (Sundarnagar, East Singhbhum)
- **10 Tribal Members:** Sita Hansda (Leader), Parvati Murmu (Treasurer), Malati Soren, Sumitra Tudu, Birbaha Hembram, Jasmani Mundu, Sukurmani Purty, Salomi Soy, Champa Samad, Mani Gagrai.
- **3 Months of Weekly Meetings:** 12 locked weekly meetings with ~90% attendance and ₹100 weekly savings per member.
- **4 Real Loans:**
  1. *Sita Hansda:* Livestock/Dairy (₹4,000) - Active, 3 repayments on time.
  2. *Malati Soren:* Farming/Seeds (₹2,500) - Active, 2 repayments on time.
  3. *Jasmani Mundu:* Grocery Shop (₹2,000) - Fully Paid back with interest.
  4. *Sukurmani Purty:* Sewing Machine (₹3,000) - Overdue by 14 days, with ₹20 late fine applied.
- **Transparent Credit Score:** ~78-83 (Good / Bank Ready Band).

---

## ☁️ Cloud Sync & Supabase Setup (Optional)

SakhiNidhi runs **100% offline without cloud setup** (gracefully displaying *"Offline Mode - Local Storage"*). To enable remote cloud backups:

1. Create a free account at [Supabase](https://supabase.com/).
2. Create a new free project and run the following SQL in the **SQL Editor**:

```sql
-- Supabase Tables Schema for SakhiNidhi
CREATE TABLE IF NOT EXISTS groups (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  village TEXT,
  meetingDay TEXT,
  weeklySaving NUMERIC DEFAULT 50,
  interestRate NUMERIC DEFAULT 2,
  lateFine NUMERIC DEFAULT 10,
  maxLoanMultiple NUMERIC DEFAULT 3,
  pin TEXT DEFAULT '1234',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  synced BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS members (
  id BIGINT PRIMARY KEY,
  groupId BIGINT REFERENCES groups(id),
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'member',
  avatarColor TEXT,
  active BOOLEAN DEFAULT true,
  joinedDate TIMESTAMP WITH TIME ZONE,
  synced BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS meetings (
  id BIGINT PRIMARY KEY,
  groupId BIGINT REFERENCES groups(id),
  meetingNumber INT,
  meetingDate DATE,
  notes TEXT,
  locked BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE,
  synced BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS savings (
  id BIGINT PRIMARY KEY,
  groupId BIGINT,
  meetingId BIGINT,
  memberId BIGINT,
  amount NUMERIC,
  date DATE,
  reversed BOOLEAN DEFAULT false,
  reversalReason TEXT,
  synced BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS loans (
  id BIGINT PRIMARY KEY,
  groupId BIGINT,
  memberId BIGINT,
  principal NUMERIC,
  interestRate NUMERIC,
  tenureMonths INT,
  purpose TEXT,
  status TEXT,
  issuedDate DATE,
  dueDate DATE,
  synced BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS repayments (
  id BIGINT PRIMARY KEY,
  loanId BIGINT,
  memberId BIGINT,
  meetingId BIGINT,
  amount NUMERIC,
  principalPaid NUMERIC,
  interestPaid NUMERIC,
  finePaid NUMERIC DEFAULT 0,
  date DATE,
  reversed BOOLEAN DEFAULT false,
  synced BOOLEAN DEFAULT true
);
```

3. Create a `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🚢 Deployment on Vercel (100% Free)

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial SakhiNidhi production build"
   git branch -M main
   git remote add origin https://github.com/<your-username>/sakhinidhi.git
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Framework preset: **Vite** (Root Directory: `./`).
5. Click **Deploy**. Your app will be live with full HTTPS (e.g. `https://sakhinidhi.vercel.app`).

---

## 📱 Generating Downloadable Android APK & Over-The-Air (OTA) Updates

### Option A: Direct Download (Ready Right Now)
A binary Android APK package is pre-built and placed at:
- `public/downloads/sakhinidhi.apk`
- Any visitor clicking **"Download APK"** on the website downloads this binary Android package directly.

### Option B: Cloud Build with PWABuilder (Zero Local Tools)
1. Open [PWABuilder](https://www.pwabuilder.com/) in your browser.
2. Enter your live Vercel URL and click **Start**.
3. Click **Package for Stores** -> **Android** -> **Build APK**.
4. Replace `public/downloads/sakhinidhi.apk` with the signed production APK.

### Option C: Capacitor Live Updates (OTA)
- Configured in `capacitor.config.json` with App ID `org.sakhinidhi.app`.
- Supports Over-The-Air (OTA) updates using Capgo or Ionic Appflow so code updates can be pushed to installed phones without re-installing the APK.

---

## 🏛️ Hidden Bank Officer Dashboard

Available via direct link at `/bank/:groupId` (e.g., `/bank/1`):  
Provides:
- 📊 **Weekly Financial Trends:** 8-week savings collection vs. loan repayments.
- 🎯 **Loan Portfolio Breakdown:** Visual distribution by livelihood (Farming, Livestock, Shop, Tailoring).
- 🛡️ **Verified Records Audit Badge:** Tamper-evident ledger synchronization confirmation.
- 📑 **Comprehensive Loan Register:** Stacked responsive cards on smartphones and multi-column tables on desktop laptops.

---

## 📄 License
MIT License • Built with pride for **Tribe 2026 Hackathon (Women-led Enterprises)**.
