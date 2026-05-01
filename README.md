# 🚀 TaskFlow — Team Task Manager

> **Live Demo:** [https://taskflow-six-ashen.vercel.app](https://taskflow-six-ashen.vercel.app)  
> **Backend API:** [https://taskflow-rm4o.onrender.com](https://taskflow-rm4o.onrender.com)

A full-stack web application for project and task management with role-based access control, Kanban board, and analytics.

---

## ✨ Features

- ✅ **JWT Authentication** — Signup, login, refresh tokens, password reset
- ✅ **Project Management** — Create, edit, archive projects with team invites
- ✅ **Kanban Board** — Drag-and-drop task management (powered by dnd-kit)
- ✅ **Role-Based Access** — Admin vs Member permissions enforced on all endpoints
- ✅ **Task System** — Priority, status, due dates, labels, assignments, comments
- ✅ **Dashboard Analytics** — Charts, completion rates, overdue alerts
- ✅ **Rate Limiting** — 5 failed login attempts → 15-min lockout
- ✅ **Responsive Design** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (15m access + 7d refresh) + bcrypt |
| **Frontend** | React 18 + Vite |
| **State** | Redux Toolkit |
| **Styling** | Tailwind CSS |
| **Drag & Drop** | dnd-kit |
| **Charts** | Recharts |
| **Deployment** | Railway |

---

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, REFRESH_TOKEN_SECRET
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
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

---

## 🚀 Deployment (Railway)

### Backend
1. Push to GitHub
2. Create Railway project → connect repo
3. Add MongoDB plugin
4. Set environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<from Railway>
   JWT_SECRET=<random 64-char string>
   REFRESH_TOKEN_SECRET=<random 64-char string>
   FRONTEND_URL=<your frontend Railway URL>
   ```
5. Railway auto-deploys on push

### Frontend
1. Set `VITE_API_URL=<backend Railway URL>/api`
2. Build command: `npm run build`
3. Output directory: `dist`

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/       # database, jwt
│   │   ├── controllers/  # auth, project, task, analytics
│   │   ├── middleware/   # auth, rbac, errorHandler
│   │   ├── models/       # User, Project, Task, TeamMember, Comment
│   │   ├── routes/       # auth, projects, tasks, analytics
│   │   ├── utils/        # jwt, errors, validators
│   │   └── app.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/          # axios clients
    │   ├── components/   # Layout, Modal, TaskForm, ProjectForm, Sidebar
    │   ├── pages/        # Dashboard, Projects, TaskBoard, TaskDetail, Profile
    │   ├── store/        # Redux slices
    │   ├── App.jsx
    │   └── main.jsx
    └── .env.example
```

---

## 🧪 Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- JWT tokens: 15-minute access + 7-day refresh
- Rate limiting: 20 auth requests / 15 min window
- Account lockout after 5 failed logins (15 min)
- Helmet.js security headers
- CORS configured to frontend URL only
- Input validation via Joi (server) on all endpoints
- MongoDB injection prevention via Mongoose

---

## 📄 License

MIT
