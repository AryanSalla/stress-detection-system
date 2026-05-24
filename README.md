# 🧠 MindGuard — AI Student Stress Detection System
### National Level Project | Full-Stack AI Application

---

## 📋 Table of Contents
1. [What This Project Does](#what-this-project-does)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Running the Project](#running-the-project)
6. [First Login](#first-login)
7. [Using the Application](#using-the-application)
8. [Enable AI Features](#enable-ai-features)
9. [Project Structure](#project-structure)
10. [Troubleshooting](#troubleshooting)

---

## What This Project Does

MindGuard detects student stress levels in 3 phases:

| Phase | What happens |
|-------|-------------|
| **Phase 1 — Quiz** | 15 weighted Likert-scale questions → Stress Score 1 |
| **Phase 2 — Scenario Analysis** | Write responses to real-life student scenarios → NLP analysis → Stress Score 2 |
| **Phase 3 — AI Fusion** | Random Forest model fuses both scores → Final stress level (Low / Moderate / High) |
| **Phase 4 — Recommendations** | Personalized action plan + AI chatbot support |

---

## Tech Stack

- **Frontend:** React 18 + Tailwind CSS + Recharts
- **Backend:** Python Flask REST API + JWT Auth
- **Database:** MySQL 8.0
- **NLP:** VADER Sentiment + NLTK
- **ML:** Scikit-learn (Random Forest)
- **AI:** Anthropic Claude API (optional, for chatbot + smart recommendations)

---

## Prerequisites

Install these before starting:

### 1. Python 3.9 or higher
- Download: https://www.python.org/downloads/
- During install on Windows: ✅ **check "Add Python to PATH"**
- Verify: `python --version` or `python3 --version`

### 2. Node.js 18 or higher
- Download: https://nodejs.org/en/download
- Verify: `node --version`

### 3. MySQL 8.0
- Download: https://dev.mysql.com/downloads/mysql/
- During install, set a **root password** — you'll need it later
- Verify: `mysql --version`

### 4. Git (optional but recommended)
- Download: https://git-scm.com/downloads

---

## Step-by-Step Setup

### Step 1 — Extract the ZIP

Unzip `stress-detection-system.zip` anywhere on your computer.

```
stress-detection-system/
├── backend/
├── frontend/
├── database/
├── ml_models/
├── docs/
├── setup.sh       ← Linux/Mac one-click setup
└── setup.bat      ← Windows one-click setup
```

Open a terminal (or Command Prompt on Windows) and navigate into the folder:

```bash
cd stress-detection-system
```

---

### Step 2 — Set Up the Database

Open MySQL and run both SQL files.

**Option A — Using MySQL command line:**
```bash
# Create the database and tables
mysql -u root -p < database/schema.sql

# Load the demo questions and scenarios
mysql -u root -p stress_detection < database/seed_data.sql
```

**Option B — Using MySQL Workbench:**
1. Open MySQL Workbench → connect to your local server
2. File → Open SQL Script → select `database/schema.sql` → Run (⚡)
3. File → Open SQL Script → select `database/seed_data.sql` → Run (⚡)

---

### Step 3 — Configure the Backend

```bash
cd backend
```

**Copy the example environment file:**

```bash
# Linux / Mac
cp .env.example .env

# Windows
copy .env.example .env
```

**Open `.env` in any text editor and fill in your MySQL password:**

```
FLASK_ENV=development
SECRET_KEY=any-long-random-string-here
JWT_SECRET_KEY=another-long-random-string-here

DB_USER=root
DB_PASS=YOUR_MYSQL_PASSWORD_HERE   ← change this
DB_HOST=localhost
DB_PORT=3306
DB_NAME=stress_detection

# Optional: Add your Anthropic API key to unlock AI chatbot
ANTHROPIC_API_KEY=

CORS_ORIGINS=http://localhost:3000
```

---

### Step 4 — Install Backend Dependencies

Still inside the `backend/` folder:

```bash
# Create a virtual environment
python -m venv venv

# Activate it
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install all Python packages
pip install -r requirements.txt

# Download NLP data (run once)
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('punkt_tab')"
```

---

### Step 5 — Train the ML Model (Run Once)

```bash
# From the project root folder (not inside backend/)
cd ..

# Activate venv if not already active
# Mac/Linux:
source backend/venv/bin/activate
# Windows:
backend\venv\Scripts\activate

# Train the model
python ml_models/training/train_model.py
```

You should see output like:
```
✅ Generated 1200 synthetic training samples
📊 Random Forest: Test Accuracy: 0.9583
💾 Model saved → backend/app/ml/saved_models/stress_classifier.pkl
✅ Training complete!
```

---

### Step 6 — Install Frontend Dependencies

Open a **new terminal window**, navigate to the project root:

```bash
cd stress-detection-system/frontend

# Copy env file
# Mac/Linux:
cp .env.example .env.local
# Windows:
copy .env.example .env.local

# Install packages (this takes 1-2 minutes)
npm install
```

---

## Running the Project

You need **two terminal windows running at the same time.**

### Terminal 1 — Start the Backend

```bash
cd stress-detection-system/backend

# Activate virtual environment
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Start Flask server
python run.py
```

✅ You should see:
```
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

### Terminal 2 — Start the Frontend

```bash
cd stress-detection-system/frontend

npm start
```

✅ Your browser will automatically open to **http://localhost:3000**

---

## First Login

A demo account is pre-loaded. Use these credentials:

```
Email:    demo@stressdetect.ai
Password: Demo@1234
```

Or click **"Create one"** on the login page to register a new account.

---

## Using the Application

Follow this flow for a complete assessment:

```
1. Login / Register
       ↓
2. Dashboard — see your overview
       ↓
3. Quiz Assessment (Phase 1)
   • Answer 15 questions using the 1–5 scale
   • Click each number to answer, auto-advances
   • Submit when all 15 are answered
       ↓
4. Scenario Analysis (Phase 2)
   • Read each scenario carefully
   • Type your honest response (min 20 characters)
   • Click "Analyze & Next" — NLP runs in real time
       ↓
5. Results Page (Phase 3 + 4)
   • See your Final Stress Score (0–100)
   • View personalized recommendations
   • Start over any time with "New Assessment"
       ↓
6. MindEase Chatbot
   • Get conversational mental health support
   • Works with or without an API key
       ↓
7. History & Trends
   • Track your stress over time
   • See score trend charts
```

---

## Enable AI Features

By default the app works fully with rule-based NLP and the trained ML model.

To enable the **AI chatbot** and **AI-generated personalized recommendations**:

1. Get a free API key at: https://console.anthropic.com/
2. Open `backend/.env`
3. Add your key:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
   ```
4. Restart the backend (`Ctrl+C` then `python run.py` again)

---

## Project Structure

```
stress-detection-system/
│
├── backend/                    Flask REST API
│   ├── app/
│   │   ├── __init__.py         App factory
│   │   ├── models/             Database models (8 tables)
│   │   ├── routes/             API endpoints
│   │   │   ├── auth.py         Register, Login, Profile
│   │   │   ├── quiz.py         Phase 1 quiz
│   │   │   ├── scenario.py     Phase 2 scenarios
│   │   │   ├── assessment.py   Phase 3 score fusion
│   │   │   ├── history.py      Past assessments
│   │   │   ├── chatbot.py      MindEase AI chat
│   │   │   └── alerts.py       Stress alerts
│   │   ├── nlp/
│   │   │   └── pipeline.py     VADER + NLTK NLP engine
│   │   ├── ml/
│   │   │   ├── stress_model.py Random Forest classifier
│   │   │   └── saved_models/   Trained model files (auto-generated)
│   │   └── services/
│   │       └── recommendation_service.py
│   ├── config.py               All configuration
│   ├── run.py                  Entry point
│   ├── requirements.txt        Python dependencies
│   └── .env.example            Environment template
│
├── frontend/                   React application
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js              Routes
│       ├── pages/
│       │   ├── LoginPage.js
│       │   ├── RegisterPage.js
│       │   ├── DashboardPage.js
│       │   ├── QuizPage.js
│       │   ├── ScenarioPage.js
│       │   ├── ResultsPage.js
│       │   ├── HistoryPage.js
│       │   └── ChatbotPage.js
│       ├── components/
│       │   └── Layout/Layout.js   Sidebar + navigation
│       ├── context/
│       │   └── AuthContext.js     Auth state management
│       └── utils/
│           └── api.js             Axios API client
│
├── database/
│   ├── schema.sql              All 8 table definitions
│   └── seed_data.sql           Questions, scenarios, demo user
│
├── ml_models/
│   ├── training/
│   │   └── train_model.py      Train Random Forest model
│   └── data/
│       └── stress_dataset.csv  Training data
│
├── docs/
│   └── TECHNICAL_DOCUMENTATION.md
│
├── setup.sh                    One-click setup (Linux/Mac)
└── setup.bat                   One-click setup (Windows)
```

---

## API Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/quiz/questions` | Get quiz questions |
| POST | `/api/quiz/start` | Start quiz session |
| POST | `/api/quiz/submit` | Submit answers |
| GET | `/api/scenario/list` | Get scenarios |
| POST | `/api/scenario/analyze` | Analyze text response |
| POST | `/api/scenario/complete` | Finalize scenario session |
| POST | `/api/assessment/final` | Get final fused score |
| GET | `/api/history/` | Get assessment history |
| POST | `/api/chatbot/message` | Chat with MindEase |
| GET | `/api/health` | Server health check |

Test the API health check: http://localhost:5000/api/health

---

## Troubleshooting

### ❌ "pip is not recognized" (Windows)
Make sure Python was added to PATH during install. Re-install Python and check the "Add to PATH" box.

### ❌ MySQL connection error
- Make sure MySQL server is running
- Check `DB_PASS` in `backend/.env` matches your MySQL root password
- Try: `mysql -u root -p` in terminal to verify MySQL is accessible

### ❌ Port 5000 already in use
```bash
# Mac/Linux — find and kill the process
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### ❌ Port 3000 already in use
The React dev server will ask: "Would you like to run on a different port?" — type `Y` and press Enter.

### ❌ "Module not found" errors in React
```bash
cd frontend
rm -rf node_modules
npm install
```

### ❌ ML model not found warning
This is okay — the backend falls back to the weighted formula automatically.
To fix it, run the training script:
```bash
python ml_models/training/train_model.py
```

### ❌ NLTK data errors
```bash
cd backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
python -c "import nltk; nltk.download('all')"
```

### ❌ "Access denied" for MySQL seed data
Run each file separately and make sure the database exists first:
```sql
CREATE DATABASE IF NOT EXISTS stress_detection;
```

---

## One-Click Setup (Alternative)

If you prefer a single script:

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```bash
setup.bat
```

> Note: The setup scripts require MySQL to be in your system PATH.

---

## Support

- Demo account: `demo@stressdetect.ai` / `Demo@1234`
- API docs: http://localhost:5000/api/health
- Crisis support hotline: iCall — **9152987821** (India, free & confidential)

---

*MindGuard — National Level AI Student Stress Detection Project*
