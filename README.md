 HEAD
# 🤖 AI Intent Review v5.0

## 🚀 Setup

### Terminal 1 — Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env → set MONGODB_URI
npm run dev
```

### Terminal 2 — Seed DB (wipes old data + creates demo accounts)
```bash
cd backend
node seed.js
```

### Terminal 3 — Frontend
```bash
cd frontend
npm install
npm start
```

## 🔑 Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| HR   | hr@demo.com | demo123 |
| Candidate | candidate@demo.com | demo123 |

---

## ✅ What's New in v5

### 1. Candidate Inbox Page (`/candidate/inbox`)
- Separate Inbox page in candidate nav (Dashboard · Inbox · My Profile)
- Shows all HR conversations threaded by application
- Unread message badge counts
- Can only REPLY — cannot initiate conversations
- "🔇 Muted" label shown when HR disables replies

### 2. HR Messaging Control
- Every conversation in HR Inbox has **🔇 Disable Replies / 🔊 Enable Replies** toggle
- Same toggle in Applicants detail panel
- When muted: candidate sees a clear "Replies Disabled by HR" message
- HR can re-enable at any time

### 3. Shortlist Visibility Fix
- On apply → candidate only sees **"📋 Submitted"** / **"🔍 Under Review"**
- AI scores are NEVER shown to candidate
- **Only after HR explicitly updates status** (shortlisted / interview / offered / rejected)
  does the candidate see the real status
- Status visible to candidate: Submitted → Under Review → Shortlisted → Interview → Offered / Not Selected

### 4. HR Job Status Dashboard (`/hr/job/:id/status`)
- Click any job title in HR Dashboard → goes to Job Status page
- Shows: Total applied, Top (AI), Good (AI), Shortlisted, Interview, Rejected, Pending, Avg Score
- Clickable stat cards filter the list
- Each candidate row: rank, score ring, mini score bars, friendly status dropdown
- Click a candidate → full detail panel (AI summary, strengths/gaps, score breakdown, links)
- Update status directly from this page
- "📊 Status" button on each job card in HR Dashboard

---

## 📋 Complete Routes

### Backend
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/applications/job-status/:jobId | HR |
| PUT | /api/applications/:id/status | HR (sets hrStatusVisible=true) |
| GET | /api/applications/candidate/mine | Candidate (scores hidden) |
| PUT | /api/messages/hr/toggle-messaging/:appId | HR |
| GET | /api/messages/candidate/inbox | Candidate |
| GET | /api/messages/hr/threads | HR |
| PUT | /api/messages/mark-read/:appId | Both |

### Frontend
| Page | Path | Who |
|------|------|-----|
| Job Status | /hr/job/:id/status | HR |
| HR Inbox | /hr/inbox | HR |
| Candidate Dashboard | /candidate | Candidate |
| Candidate Inbox | /candidate/inbox | Candidate |
| Candidate Profile | /candidate/profile | Candidate |
| Apply Form | /apply/:token | Public (login required to submit) |

---

## 🔐 .env
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-intent-review
JWT_SECRET=aiintentreview_secret_2025
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
# Optional GitHub token for real repo analysis:
# GITHUB_TOKEN=ghp_yourtoken
```
=======
# AI-Intent-Review-Analysis-Auto-Sort-Lister
 c2755440f134dc386837ad68b11a428efc740a09
