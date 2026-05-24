# AI Student Stress Detection System — Technical Documentation
### National Level Project | Full Architecture & Developer Guide

---

## 1. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                    React.js + Tailwind CSS                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST API
┌───────────────────────────▼─────────────────────────────────────┐
│                     FLASK REST API                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   Auth   │ │  Quiz    │ │ Scenario │ │Assessment│          │
│  │ Module   │ │ Module   │ │ Module   │ │ Module   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ History  │ │ Chatbot  │ │ Alerts   │ │  Reco.   │          │
│  │ Module   │ │ Module   │ │ Module   │ │  Engine  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└───────┬───────────────────────────┬────────────────────────────┘
        │                           │
┌───────▼──────┐         ┌─────────▼──────────────────────────────┐
│   MySQL DB   │         │           AI / ML Layer                │
│  8 Tables    │         │  ┌─────────────┐  ┌──────────────────┐ │
│  Full Schema │         │  │ NLP Pipeline│  │ Stress Classifier│ │
└──────────────┘         │  │ VADER+NLTK  │  │ Random Forest    │ │
                         │  └─────────────┘  └──────────────────┘ │
                         │  ┌──────────────────────────────────┐   │
                         │  │   Claude AI API (Anthropic)       │   │
                         │  │   Chatbot + AI Recommendations    │   │
                         │  └──────────────────────────────────┘   │
                         └────────────────────────────────────────┘
```

---

## 2. MODULE DESCRIPTIONS

### Module 1: Authentication (JWT-based)
- Register/Login with bcrypt password hashing
- Access token (24h) + Refresh token (30d)
- Protected routes via Flask-JWT-Extended

### Module 2: Quiz Assessment (Phase 1)
- 15 weighted Likert-scale questions (5 categories)
- Score = Σ(response × weight), normalized 0–100
- Categories: Academic, Social, Physical, Emotional, Financial

### Module 3: Scenario Analysis (Phase 2)
- 7 real-life student scenarios (text response)
- NLP pipeline: VADER sentiment + lexicon emotion + keyword extraction
- Per-response stress indicator → session aggregate score

### Module 4: NLP Pipeline
```
Input Text → Preprocessing → Sentiment (VADER) → Emotion Detection →
Keyword Extraction → Stress Score Formula → Output
```

### Module 5: ML Stress Classifier (Phase 3)
- **Primary**: Random Forest (trained on 1200+ samples)
- **Fallback**: Weighted formula: 0.4×Quiz + 0.6×Scenario
- Features: quiz_score, scenario_score, sentiment_score, emotion_encoded

### Module 6: Recommendation Engine (Phase 4)
- Static templates for Low / Moderate / High
- AI-enhanced personalization via Claude API (optional)
- Categories: Immediate, Short-term, Long-term, Professional

### Module 7: AI Chatbot (MindEase)
- Powered by Claude API with mental health system prompt
- Rule-based fallback when API key not set
- Conversation history maintained per session

### Module 8: Alerts System
- Real-time high-stress alerts after each assessment
- Unread badge in navigation
- Mark-as-read API

---

## 3. DATABASE SCHEMA OVERVIEW

| Table               | Purpose                              |
|---------------------|--------------------------------------|
| users               | Student accounts                     |
| quiz_questions      | 15 weighted quiz questions           |
| quiz_sessions       | Quiz attempt per user                |
| quiz_responses      | Individual answers                   |
| scenarios           | 7 real-life scenarios                |
| scenario_sessions   | Scenario attempt per user            |
| scenario_responses  | Text responses + NLP analysis        |
| assessments         | Final fused scores                   |
| recommendations     | Per-assessment recommendations       |
| chat_sessions       | Chatbot conversation sessions        |
| chat_messages       | Individual chat messages             |
| stress_alerts       | User alerts/notifications            |
| audit_log           | System activity log                  |

---

## 4. API ENDPOINTS REFERENCE

### Auth
| Method | Endpoint              | Auth | Description           |
|--------|-----------------------|------|-----------------------|
| POST   | /api/auth/register    | No   | Create account        |
| POST   | /api/auth/login       | No   | Login + get tokens    |
| GET    | /api/auth/profile     | Yes  | Get profile           |
| PUT    | /api/auth/profile     | Yes  | Update profile        |
| POST   | /api/auth/refresh     | Yes  | Refresh access token  |
| POST   | /api/auth/change-password | Yes | Change password   |

### Quiz
| Method | Endpoint               | Auth | Description           |
|--------|------------------------|------|-----------------------|
| GET    | /api/quiz/questions    | Yes  | Get all questions     |
| POST   | /api/quiz/start        | Yes  | Start quiz session    |
| POST   | /api/quiz/submit       | Yes  | Submit all answers    |
| GET    | /api/quiz/result/{id}  | Yes  | Get quiz result       |

### Scenario
| Method | Endpoint                    | Auth | Description            |
|--------|-----------------------------|------|------------------------|
| GET    | /api/scenario/list          | Yes  | Get all scenarios      |
| POST   | /api/scenario/start         | Yes  | Start session          |
| POST   | /api/scenario/analyze       | Yes  | Analyze one response   |
| POST   | /api/scenario/complete      | Yes  | Finalize session       |
| GET    | /api/scenario/result/{id}   | Yes  | Get session result     |

### Assessment
| Method | Endpoint                  | Auth | Description             |
|--------|---------------------------|------|-------------------------|
| POST   | /api/assessment/final     | Yes  | Compute final score     |
| GET    | /api/assessment/{id}      | Yes  | Get assessment detail   |

### Other
| Method | Endpoint              | Auth | Description             |
|--------|-----------------------|------|-------------------------|
| GET    | /api/history/         | Yes  | History + trend data    |
| POST   | /api/chatbot/start    | Yes  | Start chat session      |
| POST   | /api/chatbot/message  | Yes  | Send/receive message    |
| GET    | /api/chatbot/history/{id} | Yes | Get chat history    |
| GET    | /api/alerts/          | Yes  | Get alerts              |
| POST   | /api/alerts/mark-read | Yes  | Mark alerts read        |
| GET    | /api/health           | No   | Health check            |

---

## 5. SCORING FORMULAS

### Phase 1 – Quiz Score
```
Raw Score = Σ(response_value × question_weight)
Normalized = (Raw / Max_Possible) × 100
Max Possible = 5 × 1.5 × 15 = 112.5
```

### Phase 2 – Scenario Score
```
Sentiment Component = -VADER_compound × 30
Emotion Component   = Σ(emotion_score × weight) × 30
Keyword Component   = (stress_keywords - coping_keywords) × 3
Stress Score = 50 + Sentiment + Emotion + Keyword  [clamped 0–100]
```

### Phase 3 – Final Score
```
Final Score = (0.40 × Quiz Score) + (0.60 × Scenario Score)
```

### Classification Thresholds
| Level    | Score Range |
|----------|-------------|
| Low      | 0 – 40      |
| Moderate | 41 – 70     |
| High     | 71 – 100    |

---

## 6. FUTURE SCOPE

### Smartwatch Integration
- Collect HRV, skin conductance, sleep data via wearable APIs
- Fuse physiological data as Phase 4 input

### Mobile Application
- React Native app with push notifications
- Offline quiz capability

### Advanced ML
- Deep learning model (LSTM) on longitudinal data
- Federated learning for privacy-preserving training

### Institutional Dashboard
- Counselor portal for aggregate trend analysis
- Anonymous cohort-level reporting

---

## 7. TECH STACK SUMMARY

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Frontend    | React 18, Tailwind CSS, Recharts       |
| Backend     | Flask 3, SQLAlchemy, JWT               |
| Database    | MySQL 8.0                              |
| NLP         | VADER, NLTK, TextBlob                  |
| ML          | scikit-learn (Random Forest + LR)      |
| AI API      | Anthropic Claude (optional)            |
| Auth        | bcrypt, JWT (access + refresh tokens)  |
| Deployment  | Docker-ready, env-configurable         |
