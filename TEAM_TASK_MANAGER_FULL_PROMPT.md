# 🚀 Team Task Manager - Full-Stack Development Prompt

## Project Overview
Build a complete full-stack Team Task Manager web application with authentication, project management, task tracking, and role-based access control. The application must be deployed and fully functional.

---

## 📋 Core Requirements

### 1. **Authentication System**
- **User Registration (Signup)**
  - Email validation
  - Password hashing (bcrypt)
  - Email uniqueness check
  - Password strength requirements (min 8 chars, numbers, symbols)
  - Optional: Email verification

- **User Login**
  - JWT-based authentication
  - Secure session management
  - Remember me functionality
  - Password reset capability
  - Rate limiting on failed login attempts (max 5 attempts, 15 min lockout)

- **Authentication State**
  - Persist auth token in localStorage/sessionStorage
  - Auto-logout on token expiration
  - Logout functionality
  - Profile management (update name, email, password)

---

### 2. **Project Management**
- **Create Project**
  - Project name, description, start date, end date
  - Optional: project color/icon
  - Creator automatically becomes Admin
  - Unique project identifiers

- **Manage Projects**
  - View all user's projects
  - Edit project details (name, description, dates)
  - Delete project (Admin only)
  - Archive project (soft delete)
  - Project status: Active, On Hold, Completed, Archived

- **Team Management**
  - Add team members via email
  - Remove team members (Admin only)
  - Assign roles: Admin, Member
  - View team roster with roles
  - Change member roles (Admin only)

---

### 3. **Task Management**
- **Create Task**
  - Task title, description
  - Assigned to (team member)
  - Priority: Low, Medium, High, Urgent
  - Status: To Do, In Progress, In Review, Done
  - Due date
  - Project association
  - Optional: subtasks, labels, attachments

- **Update Task**
  - Change status
  - Reassign to different member
  - Update priority and due date
  - Add comments/notes
  - Update description
  - Mark as complete

- **View Tasks**
  - List view with filters and sorting
  - Kanban board view (drag-drop by status)
  - Calendar view (by due date)
  - Individual task details page
  - Task activity/history timeline

---

### 4. **Dashboard & Analytics**
- **Dashboard Overview**
  - Total projects count
  - Total tasks count
  - Tasks by status breakdown
  - Overdue tasks alert
  - Tasks assigned to current user

- **Task Analytics**
  - Tasks completed this week/month
  - Task completion rate percentage
  - Average task completion time
  - Tasks by priority distribution
  - Team member workload distribution

- **Filters & Search**
  - Filter by project
  - Filter by assigned member
  - Filter by priority
  - Filter by status
  - Full-text search across tasks

---

### 5. **Role-Based Access Control (RBAC)**

| Feature | Admin | Member |
|---------|-------|--------|
| Create Project | ✅ | ❌ |
| Edit Project | ✅ | ❌ |
| Delete Project | ✅ | ❌ |
| Manage Team Members | ✅ | ❌ |
| Create Task | ✅ | ✅ |
| Assign Task | ✅ | ✅* |
| Edit Own Task | ✅ | ✅ |
| Edit Any Task | ✅ | ❌ |
| Delete Task | ✅ | ❌ |
| View Reports | ✅ | ✅** |
| Manage Roles | ✅ | ❌ |

*Members can create and assign tasks to themselves or request assignment
**Members see only their own tasks

---

## 🛠️ Technology Stack

### **Backend**
- **Framework:** Node.js + Express.js (or alternative: Django, FastAPI)
- **Database:** MongoDB (NoSQL) or PostgreSQL (SQL)
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Validation:** Joi/Yup
- **Middleware:** CORS, helmet, rate-limiter
- **Testing:** Jest/Mocha (optional but recommended)

### **Frontend**
- **Framework:** React.js (or Vue.js/Svelte)
- **State Management:** Redux Toolkit / Context API / Zustand
- **UI Library:** Material-UI / Tailwind CSS / Bootstrap
- **HTTP Client:** Axios/Fetch
- **Date Handling:** date-fns or moment.js
- **Kanban Board:** React Beautiful DnD / dnd-kit
- **Icons:** React Icons / Feather Icons

### **Deployment**
- **Platform:** Railway.app
- **Database Hosting:** Railway (MongoDB/PostgreSQL)
- **Environment:** Node.js runtime
- **CI/CD:** GitHub Actions (optional)

---

## 📊 Database Schema

### **Users Collection/Table**
```
{
  _id: ObjectId / UUID
  email: String (unique, required)
  name: String (required)
  password: String (hashed, required)
  avatar: String (URL)
  createdAt: Date
  updatedAt: Date
  isEmailVerified: Boolean (default: false)
  lastLogin: Date
}
```

### **Projects Collection/Table**
```
{
  _id: ObjectId / UUID
  name: String (required)
  description: String
  creator: ObjectId (ref: Users, required)
  startDate: Date
  endDate: Date
  status: String (Active, On Hold, Completed, Archived)
  color: String (optional)
  createdAt: Date
  updatedAt: Date
}
```

### **TeamMembers Collection/Table**
```
{
  _id: ObjectId / UUID
  project: ObjectId (ref: Projects, required)
  user: ObjectId (ref: Users, required)
  role: String (Admin, Member, required)
  joinedAt: Date
  lastActive: Date
}
```

### **Tasks Collection/Table**
```
{
  _id: ObjectId / UUID
  project: ObjectId (ref: Projects, required)
  title: String (required)
  description: String
  assignedTo: ObjectId (ref: Users, required)
  createdBy: ObjectId (ref: Users, required)
  status: String (To Do, In Progress, In Review, Done, default: To Do)
  priority: String (Low, Medium, High, Urgent, default: Medium)
  dueDate: Date
  completedAt: Date
  createdAt: Date
  updatedAt: Date
}
```

### **Comments Collection/Table** (Optional)
```
{
  _id: ObjectId / UUID
  task: ObjectId (ref: Tasks, required)
  author: ObjectId (ref: Users, required)
  text: String (required)
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔌 REST API Endpoints

### **Authentication Routes**
```
POST   /api/auth/signup              - Register new user
POST   /api/auth/login               - Login user
POST   /api/auth/logout              - Logout (optional)
POST   /api/auth/refresh             - Refresh JWT token
POST   /api/auth/forgot-password     - Request password reset
POST   /api/auth/reset-password      - Reset password with token
GET    /api/auth/me                  - Get current user profile
PUT    /api/auth/profile             - Update user profile
```

### **Project Routes**
```
POST   /api/projects                 - Create new project (Admin)
GET    /api/projects                 - Get all user projects
GET    /api/projects/:id             - Get project details
PUT    /api/projects/:id             - Update project (Admin)
DELETE /api/projects/:id             - Delete project (Admin)
GET    /api/projects/:id/members     - Get project team
POST   /api/projects/:id/members     - Add team member (Admin)
DELETE /api/projects/:id/members/:uid - Remove team member (Admin)
PUT    /api/projects/:id/members/:uid - Update member role (Admin)
```

### **Task Routes**
```
POST   /api/tasks                    - Create task
GET    /api/tasks                    - Get tasks (with filters)
GET    /api/tasks/:id                - Get task details
PUT    /api/tasks/:id                - Update task
DELETE /api/tasks/:id                - Delete task (Admin)
PATCH  /api/tasks/:id/status         - Update task status
PATCH  /api/tasks/:id/assign         - Reassign task
GET    /api/projects/:id/tasks       - Get project tasks
```

### **Analytics Routes** (Optional)
```
GET    /api/analytics/dashboard      - Get dashboard data
GET    /api/analytics/tasks          - Get task analytics
GET    /api/analytics/completion     - Get completion stats
GET    /api/projects/:id/analytics   - Get project-specific analytics
```

---

## 🎨 Frontend Features & Pages

### **Authentication Pages**
- **Login Page** - Email, password, remember me, forgot password link
- **Signup Page** - Email, name, password, password confirm, validation messages
- **Forgot Password** - Email input, reset link sent message
- **Reset Password** - New password form with token validation

### **Main Application Pages**
- **Dashboard** - Overview, stats, recent tasks, overdue alerts
- **Projects List** - All projects with status, team count, action buttons
- **Project Detail** - Project info, team members, tasks, analytics
- **Task Board** - Kanban view with drag-drop, status columns
- **Task List** - Tabular view with filters, sorting, bulk actions
- **Task Detail** - Full task info, comments, history, edit form
- **Team Management** - Team roster, role management, add/remove members
- **User Profile** - User info, settings, password change
- **Search/Filter** - Global search with advanced filters

---

## 🔐 Security Requirements

1. **Authentication & Authorization**
   - JWT tokens with expiration (15 min access, 7 days refresh)
   - Secure password hashing (bcrypt with salt rounds: 10)
   - CORS configured correctly
   - Rate limiting on auth endpoints

2. **Input Validation**
   - Server-side validation for all inputs
   - SQL/NoSQL injection prevention
   - XSS protection
   - CSRF tokens if using cookies

3. **Data Security**
   - HTTPS only (enforced in deployment)
   - Secure headers (helmet.js)
   - Environment variables for sensitive data
   - Password reset tokens with expiration

4. **Access Control**
   - Middleware to verify user ownership
   - Verify project membership before allowing access
   - Admin-only endpoints protected
   - Query authorization checks

---

## 📦 Project Structure

### **Backend Structure**
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── jwt.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── analyticsController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── TeamMember.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── analytics.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   └── rbac.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── jwt.js
│   │   └── errors.js
│   └── app.js
├── tests/
│   ├── auth.test.js
│   ├── projects.test.js
│   └── tasks.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### **Frontend Structure**
```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── Projects/
│   │   │   ├── ProjectList.jsx
│   │   │   ├── ProjectCard.jsx
│   │   │   └── ProjectForm.jsx
│   │   ├── Tasks/
│   │   │   ├── TaskBoard.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskList.jsx
│   │   │   └── TaskForm.jsx
│   │   ├── Dashboard/
│   │   │   ├── DashboardOverview.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── TaskChart.jsx
│   │   ├── Common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Modal.jsx
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Projects.jsx
│   │   ├── ProjectDetail.jsx
│   │   ├── Tasks.jsx
│   │   ├── TaskDetail.jsx
│   │   └── Profile.jsx
│   ├── store/
│   │   ├── authSlice.js
│   │   ├── projectSlice.js
│   │   ├── taskSlice.js
│   │   └── store.js
│   ├── api/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── analytics.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProjects.js
│   │   └── useTasks.js
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx
│   └── index.jsx
├── public/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Deployment on Railway

### **Backend Deployment Steps**

1. **Create Railway Project**
   - Go to railway.app
   - Create new project
   - Connect GitHub repo

2. **Add MongoDB/PostgreSQL**
   - Add MongoDB or PostgreSQL plugin
   - Copy connection string

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<from Railway>
   JWT_SECRET=<generate secure random string>
   JWT_EXPIRE=15m
   REFRESH_TOKEN_EXPIRE=7d
   FRONTEND_URL=<your frontend Railway URL>
   ```

4. **Configure Start Command**
   ```json
   "scripts": {
     "start": "node src/app.js",
     "dev": "nodemon src/app.js"
   }
   ```

5. **Deploy**
   - Push to GitHub
   - Railway auto-deploys

### **Frontend Deployment Steps**

1. **Create React Build**
   ```bash
   npm run build
   ```

2. **Deploy on Railway**
   - Create new Railway service
   - Connect GitHub repo
   - Set Build Command: `npm run build`
   - Set Start Command: `npm start` or `serve -s build`
   - Set PORT environment variable

3. **Environment Variables** (Frontend)
   ```
   REACT_APP_API_URL=<backend Railway URL>
   ```

4. **Enable Auto-Deploy**
   - Railway auto-deploys on GitHub push

---

## 📋 Validation Rules

### **Authentication**
- Email: Valid email format, unique
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- Name: 2-50 characters, no special chars

### **Projects**
- Name: 3-100 characters, required
- Description: 0-500 characters
- Dates: Start date < end date, end date in future (optional)

### **Tasks**
- Title: 3-200 characters, required
- Description: 0-1000 characters
- Priority: Only allow predefined values
- Status: Only allow predefined values
- Due Date: Must be in future or today
- Must belong to existing project
- Must be assigned to team member of that project

---

## 🧪 Testing Scenarios

### **Authentication Tests**
- ✅ Signup with valid data
- ❌ Signup with existing email
- ❌ Signup with weak password
- ✅ Login with correct credentials
- ❌ Login with wrong password
- ✅ Auto-logout on token expiration
- ✅ Refresh token renewal

### **Project Tests**
- ✅ Admin creates project
- ❌ Member creates project (access denied)
- ✅ Admin adds team member
- ❌ Duplicate member addition
- ✅ Admin removes team member
- ✅ Admin updates project
- ✅ Admin deletes project

### **Task Tests**
- ✅ Create task in project
- ✅ Update own task
- ❌ Member update others' task (access denied)
- ✅ Change task status
- ✅ Assign task to team member
- ❌ Assign task outside project members
- ✅ Filter tasks by status/priority
- ✅ Overdue task detection

---

## 📹 Demo Video Guidelines

Your 2-5 minute demo should include:

1. **Authentication** (30 seconds)
   - Signup with new account
   - Login with credentials
   - View profile

2. **Projects** (45 seconds)
   - Create a new project
   - Add team members
   - Show team roster

3. **Tasks** (1 minute)
   - Create tasks in project
   - View task board (Kanban view)
   - Update task status (drag-drop)
   - Assign task
   - Show task details

4. **Dashboard** (45 seconds)
   - Show dashboard overview
   - Display stats and analytics
   - Show overdue tasks alert
   - Apply filters

5. **RBAC Demo** (30 seconds)
   - Show Admin can delete/manage
   - Show Member limitations
   - Demonstrate role-based UI changes

6. **Deployment** (15 seconds)
   - Show live Railway URL
   - Show app loading from live URL

---

## 📝 README Contents

Your GitHub README should include:

```markdown
# Team Task Manager

Full-stack web application for project and task management with role-based access control.

## Features
- ✅ User authentication (JWT)
- ✅ Project & team management
- ✅ Task creation and tracking
- ✅ Role-based access (Admin/Member)
- ✅ Dashboard with analytics
- ✅ Kanban board view
- ✅ Real-time task updates

## Tech Stack
- **Backend:** Node.js, Express, MongoDB/PostgreSQL
- **Frontend:** React, Redux, Tailwind CSS
- **Deployment:** Railway
- **Auth:** JWT

## Live Demo
[Your Railway URL]

## Installation

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Environment Variables
See `.env.example` in both folders

## API Documentation
[Link to API docs or describe main endpoints]

## Demo Video
[Link to demo video]

## Contributing
[Guidelines]

## License
MIT
```

---

## ✅ Submission Checklist

- [ ] GitHub repository created and public
- [ ] Backend deployed on Railway (live URL)
- [ ] Frontend deployed on Railway (live URL)
- [ ] Live URL is fully functional
- [ ] All features working as expected
- [ ] README.md with setup instructions
- [ ] .env.example files in both folders
- [ ] Demo video uploaded (YouTube/Drive)
- [ ] Video shows all key features
- [ ] No console errors or warnings
- [ ] Responsive design (mobile-friendly)
- [ ] Password reset functionality working
- [ ] RBAC enforced on all endpoints
- [ ] Input validation on all forms
- [ ] Error messages display correctly
- [ ] Loading states implemented

---

## 🎯 Bonus Features (Optional)

- [ ] Email notifications for task assignments
- [ ] Task comments/discussions
- [ ] File attachments on tasks
- [ ] Calendar view for tasks
- [ ] Progress bars on projects
- [ ] Notification bell in UI
- [ ] Dark mode toggle
- [ ] Task duplication feature
- [ ] Bulk task operations
- [ ] Export tasks as CSV/PDF
- [ ] Recurring tasks
- [ ] Sub-tasks support
- [ ] Custom task labels/tags
- [ ] Activity feed/timeline

---

## 🔗 Useful Resources

### **Documentation**
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [JWT.io](https://jwt.io/)
- [Railway Docs](https://docs.railway.app/)

### **Libraries**
- [Mongoose](https://mongoosejs.com/) - MongoDB ODM
- [Sequelize](https://sequelize.org/) - SQL ORM
- [Joi](https://joi.dev/) - Schema validation
- [Axios](https://axios-http.com/) - HTTP client
- [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd) - Drag & drop
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## ⚠️ Important Notes

1. **Security First**
   - Never commit .env file
   - Use secure password hashing
   - Implement rate limiting
   - Validate all inputs server-side
   - Use HTTPS in production

2. **Testing**
   - Test all API endpoints before deployment
   - Test RBAC thoroughly
   - Test on different devices/browsers
   - Check for responsive design

3. **Performance**
   - Index database fields
   - Implement pagination
   - Minimize API calls
   - Optimize images/assets

4. **Deployment**
   - Test staging environment first
   - Monitor logs on Railway
   - Set up error tracking (optional: Sentry)
   - Keep secrets in environment variables

---

## 🎓 Learning Objectives

By completing this project, you will learn:
- Full-stack MERN/Node stack development
- JWT authentication & authorization
- Database design & relationships
- REST API best practices
- Role-based access control
- Deployment & DevOps basics
- Frontend state management
- Error handling & validation

---

**Good luck with your Team Task Manager! Build something awesome! 🚀**
