# 🚀 TaskFlow — Team Collaboration Suite

> **Live Demo:** [https://taskflow-six-ashen.vercel.app](https://taskflow-six-ashen.vercel.app)  
> **Backend API:** [https://taskflow-production-f643.up.railway.app](https://taskflow-production-f643.up.railway.app)

A full-stack team collaboration platform with project management, real-time chat, Kanban boards, and analytics — built with the MERN stack.

---

## ✨ Features

### Core
- ✅ **Google OAuth + JWT Auth** — Sign in with Google or email/password, with refresh tokens and password reset
- ✅ **Project Management** — Create, edit, archive projects with team invites and role management
- ✅ **Kanban Board** — Drag-and-drop task management (powered by dnd-kit) with filters and search
- ✅ **Role-Based Access** — Admin vs Member permissions enforced on all endpoints
- ✅ **Task System** — Priority, status, due dates, labels, assignments, and threaded comments
- ✅ **Dashboard Analytics** — Charts, completion rates, smart priority engine, overdue alerts

### Real-Time Collaboration
- ✅ **Live Chat** — Team channels + direct messages with Ably real-time transport
- ✅ **Typing Indicators** — See when teammates are typing in real-time
- ✅ **Presence & Status** — Available / Busy / Out of Office with live status broadcasting
- ✅ **Message Notifications** — Sonner toast notifications for incoming messages with clickable actions
- ✅ **Unread Badges** — Slack-style unread count badges on sidebar and chat tabs

### Quality of Life
- ✅ **⌘K Quick Search** — Global keyboard shortcut to search tasks & projects instantly
- ✅ **Collapsible Sidebar** — Toggle to icon-only mode for more screen space (persisted in localStorage)
- ✅ **Skeleton Loading** — Premium shimmer loading screens instead of plain spinners
- ✅ **Project Progress Bars** — Visual completion tracking on each project card
- ✅ **Avatar Management** — Google profile picture + preset avatar picker with Save/Cancel flow
- ✅ **Password Visibility** — Eye/EyeOff toggles on all password fields
- ✅ **Dark Mode** — Full dark mode support with smooth theme transitions
- ✅ **Responsive Design** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (15m access + 7d refresh) + bcrypt + Google OAuth 2.0 (Passport.js) |
| **Real-Time** | Ably (chat, presence, notifications) |
| **Frontend** | React 18 + Vite |
| **State** | Redux Toolkit |
| **Styling** | Tailwind CSS |
| **Drag & Drop** | dnd-kit |
| **Charts** | Recharts |
| **Notifications** | Sonner (toast) |
| **Deployment** | Railway (Backend) + Vercel (Frontend) |

---

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google OAuth credentials (for Google login)
- Ably API key (for real-time features)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, REFRESH_TOKEN_SECRET,
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ABLY_API_KEY
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
# VITE_ABLY_KEY=<your-ably-key>
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/google/callback` | Google OAuth callback |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project (Admin) |
| DELETE | `/api/projects/:id` | Delete project (Admin) |
| GET | `/api/projects/:id/members` | List members |
| POST | `/api/projects/:id/members` | Add member (Admin) |
| DELETE | `/api/projects/:id/members/:uid` | Remove member (Admin) |
| PUT | `/api/projects/:id/members/:uid` | Change role (Admin) |
| GET | `/api/projects/:id/analytics` | Get project analytics |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (with filters) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (Admin) |
| PATCH | `/api/tasks/:id/status` | Update status |
| PATCH | `/api/tasks/:id/assign` | Reassign task |
| POST | `/api/tasks/:id/comments` | Add comment |

### Chat & Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:channel` | Get messages for a channel |
| POST | `/api/messages/:channel` | Send a message |
| POST | `/api/messages/:channel/read` | Mark channel as read |
| GET | `/api/messages/unread/counts` | Get unread counts for all channels |

### Team & Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/team` | Get team overview with statuses |
| GET | `/api/users/team/:id` | Get member detail |
| PUT | `/api/users/availability` | Update own availability status |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/:id/read` | Mark one notification read |
| PATCH | `/api/notifications/read-all` | Mark all notifications read |

---

## 🔐 RBAC

| Feature | Admin | Member |
|---------|-------|--------|
| Create Project | ✅ | ❌ |
| Edit/Delete Project | ✅ | ❌ |
| Manage Team Members | ✅ | ❌ |
| Create Task | ✅ | ✅ |
| Edit Own Task | ✅ | ✅ |
| Edit Any Task | ✅ | ❌ |
| Delete Task | ✅ | ❌ |
| View Dashboard | ✅ | ✅ |
| Chat (Team & DM) | ✅ | ✅ |

---

## 🚀 Deployment

### Backend — Railway
- **URL:** `https://taskflow-production-f643.up.railway.app`
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

Environment variables set on Railway:
```
NODE_ENV=production
MONGODB_URI=<MongoDB Atlas URI>
JWT_SECRET=<random 64-char string>
JWT_EXPIRE=15m
REFRESH_TOKEN_SECRET=<random 64-char string>
REFRESH_TOKEN_EXPIRE=7d
FRONTEND_URL=https://taskflow-six-ashen.vercel.app
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
BACKEND_URL=https://taskflow-production-f643.up.railway.app
ABLY_API_KEY=<Ably API key>
```

### Frontend — Vercel
- **URL:** `https://taskflow-six-ashen.vercel.app`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Environment variables set on Vercel:
```
VITE_API_URL=https://taskflow-production-f643.up.railway.app/api
VITE_ABLY_KEY=<Ably publishable key>
```

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/       # database, passport (Google OAuth)
│   │   ├── controllers/  # auth, project, task, analytics, notification, message
│   │   ├── middleware/   # auth, rbac, errorHandler
│   │   ├── models/       # User, Project, Task, TeamMember, Comment, Message, Notification
│   │   ├── routes/       # auth, projects, tasks, analytics, messages, notifications, users
│   │   ├── utils/        # jwt, errors, validators, seedDemo
│   │   └── app.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/          # axios clients (auth, projects, tasks, messages, notifications)
    │   ├── components/
    │   │   ├── Common/   # Sidebar, Navbar, Modal, NotificationListener, SkeletonCard
    │   │   ├── Projects/ # ProjectForm
    │   │   └── Tasks/    # TaskForm
    │   ├── pages/        # Dashboard, Projects, ProjectDetail, TaskBoard, TaskDetail, Chat, Team, Profile
    │   ├── store/        # Redux slices (auth, theme, projects, tasks, notifications)
    │   ├── App.jsx
    │   └── main.jsx
    └── .env.example
```

---

## 🧪 Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- JWT tokens: 15-minute access + 7-day refresh
- Rate limiting: 50 auth requests / 15 min, 1000 global / 15 min
- Account lockout after 5 failed logins (15 min)
- Helmet.js security headers
- CORS configured to frontend URL only
- Input validation via Joi (server) on all endpoints
- MongoDB injection prevention via Mongoose
- Google OAuth 2.0 via Passport.js (no password stored for OAuth users)

---

## 📄 License

MIT
