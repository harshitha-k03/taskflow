require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const TeamMember = require('../models/TeamMember');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// ─── helpers ────────────────────────────────────────────────────────────────
const daysAgo  = (n) => new Date(Date.now() - n * 86400000);
const daysFrom = (n) => new Date(Date.now() + n * 86400000);

const seedData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.\n');

    // ── 1. Demo User ─────────────────────────────────────────────────────────
    let demoUser = await User.findOne({ email: 'demo@taskflow.com' });

    if (demoUser) {
      console.log('🧹 Cleaning old demo data...');
      const projects = await Project.find({ creator: demoUser._id });
      const pIds = projects.map((p) => p._id);
      await Task.deleteMany({ project: { $in: pIds } });
      await TeamMember.deleteMany({ project: { $in: pIds } });
      await Project.deleteMany({ creator: demoUser._id });
      await Notification.deleteMany({ user: demoUser._id });
    } else {
      console.log('👤 Creating demo user...');
      demoUser = await User.create({
        name: 'Demo User',
        email: 'demo@taskflow.com',
        password: 'password123',
        availability: { status: 'available' },
      });
    }

    // ── 2. Team Members ───────────────────────────────────────────────────────
    console.log('👥 Setting up team members...');

    const teamDefs = [
      { name: 'Alex Rivera',   email: 'alex@taskflow.com',   seed: 'Alex',   avail: 'busy'      },
      { name: 'Sarah Chen',    email: 'sarah@taskflow.com',  seed: 'Sarah',  avail: 'available' },
      { name: 'Mike Johnson',  email: 'mike@taskflow.com',   seed: 'Mike',   avail: 'busy'      },
      { name: 'Priya Sharma',  email: 'priya@taskflow.com',  seed: 'Priya',  avail: 'ooo'       },
    ];

    const members = {};
    for (const def of teamDefs) {
      let u = await User.findOne({ email: def.email });
      if (!u) {
        u = await User.create({
          name: def.name,
          email: def.email,
          password: 'password123',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${def.seed}`,
          availability: { status: def.avail },
        });
      } else {
        await User.findByIdAndUpdate(u._id, { 'availability.status': def.avail });
      }
      members[def.seed.toLowerCase()] = u;
    }
    const { alex, sarah, mike, priya } = members;

    // ── 3. Projects ──────────────────────────────────────────────────────────
    console.log('📁 Creating projects...');

    const [p1, p2, p3] = await Project.insertMany([
      {
        name: 'TaskFlow v2.0 Redesign',
        description: 'Complete overhaul of the UI with a new design system, dark mode, and improved mobile experience.',
        color: '#6366f1',
        status: 'Active',
        startDate: daysAgo(14),
        endDate: daysFrom(21),
        creator: demoUser._id,
      },
      {
        name: 'Q3 Marketing Campaign',
        description: 'Multi-channel marketing push for the Q3 product launch covering email, social, and paid ads.',
        color: '#f59e0b',
        status: 'Active',
        startDate: daysAgo(30),
        endDate: daysAgo(2),   // already overdue project
        creator: demoUser._id,
      },
      {
        name: 'Backend API v3',
        description: 'Migrate REST endpoints to GraphQL, add WebSocket support, and improve rate limiting.',
        color: '#10b981',
        status: 'Active',
        startDate: daysAgo(5),
        endDate: daysFrom(30),
        creator: demoUser._id,
      },
    ]);

    // ── 4. Team Members per Project ─────────────────────────────────────────
    await TeamMember.insertMany([
      // Project 1
      { project: p1._id, user: demoUser._id, role: 'Admin'  },
      { project: p1._id, user: alex._id,     role: 'Member' },
      { project: p1._id, user: sarah._id,    role: 'Member' },
      { project: p1._id, user: mike._id,     role: 'Member' },
      // Project 2
      { project: p2._id, user: demoUser._id, role: 'Admin'  },
      { project: p2._id, user: alex._id,     role: 'Member' },
      { project: p2._id, user: priya._id,    role: 'Member' },
      // Project 3
      { project: p3._id, user: demoUser._id, role: 'Admin'  },
      { project: p3._id, user: sarah._id,    role: 'Member' },
      { project: p3._id, user: mike._id,     role: 'Member' },
      { project: p3._id, user: priya._id,    role: 'Member' },
    ]);

    // ── 5. Tasks ─────────────────────────────────────────────────────────────
    console.log('📋 Creating tasks...');

    await Task.insertMany([
      // ── PROJECT 1 ──
      {
        title: 'Design new color palette & token system',
        description: 'Define primary, secondary, neutral, semantic color scales. Export as CSS variables and Tailwind config.',
        status: 'Done', priority: 'High', labels: ['Design', 'Tokens'],
        project: p1._id, assignedTo: sarah._id, createdBy: demoUser._id,
        dueDate: daysAgo(10),
      },
      {
        title: 'Build reusable Button component',
        description: 'Variants: primary, secondary, danger, ghost. States: default, hover, active, disabled, loading.',
        status: 'Done', priority: 'High', labels: ['Frontend', 'Components'],
        project: p1._id, assignedTo: alex._id, createdBy: demoUser._id,
        dueDate: daysAgo(8),
      },
      {
        title: 'Implement dark mode toggle',
        description: 'Persist preference to localStorage. Apply class to HTML root. Support system preference detection.',
        status: 'Done', priority: 'Medium', labels: ['Frontend', 'UX'],
        project: p1._id, assignedTo: demoUser._id, createdBy: demoUser._id,
        dueDate: daysAgo(5),
      },
      {
        title: 'Update Navbar with notifications',
        description: 'Real-time notification badge, dropdown panel with unread indicators and type icons.',
        status: 'In Review', priority: 'High', labels: ['Frontend'],
        project: p1._id, assignedTo: alex._id, createdBy: demoUser._id,
        dueDate: daysFrom(1),
      },
      {
        title: 'Redesign Dashboard with smart widgets',
        description: 'Add greeting, focus today, deadline alerts, team status and priority charts.',
        status: 'In Progress', priority: 'Urgent', labels: ['Frontend', 'UX'],
        project: p1._id, assignedTo: demoUser._id, createdBy: demoUser._id,
        dueDate: new Date(),   // due today
      },
      {
        title: 'Accessibility audit (WCAG 2.1)',
        description: 'Run Lighthouse, axe, and manual screen reader tests across all components.',
        status: 'To Do', priority: 'Medium', labels: ['QA', 'A11y'],
        project: p1._id, assignedTo: mike._id, createdBy: demoUser._id,
        dueDate: daysFrom(4),
      },
      {
        title: 'Fix mobile navigation overflow',
        description: 'Hamburger menu items overflow on screens < 375px. Repro on iPhone SE.',
        status: 'To Do', priority: 'Urgent', labels: ['Bug', 'Mobile'],
        project: p1._id, assignedTo: demoUser._id, createdBy: alex._id,
        dueDate: daysAgo(2),   // OVERDUE
      },
      {
        title: 'Write component documentation',
        description: 'Storybook stories + README for every UI component in the design system.',
        status: 'To Do', priority: 'Low', labels: ['Documentation'],
        project: p1._id, assignedTo: null, createdBy: demoUser._id,
        dueDate: daysFrom(12),
      },
      {
        title: 'Performance benchmarking',
        description: 'Lighthouse CI baseline scores before and after the redesign. Target LCP < 1.5s.',
        status: 'To Do', priority: 'Medium', labels: ['Performance'],
        project: p1._id, assignedTo: mike._id, createdBy: demoUser._id,
        dueDate: daysFrom(7),
      },

      // ── PROJECT 2 ──
      {
        title: 'Finalize email drip copy',
        description: '3-part email sequence for new sign-ups. Subject lines, body copy, and CTAs approved by brand.',
        status: 'Done', priority: 'Medium', labels: ['Copywriting'],
        project: p2._id, assignedTo: demoUser._id, createdBy: demoUser._id,
        dueDate: daysAgo(15),
      },
      {
        title: 'Design Q3 social media kit',
        description: 'Instagram, LinkedIn, Twitter templates. Include 1080×1080 and 1200×628 variants.',
        status: 'Done', priority: 'High', labels: ['Design', 'Social'],
        project: p2._id, assignedTo: priya._id, createdBy: demoUser._id,
        dueDate: daysAgo(12),
      },
      {
        title: 'Design Google Display banner ads',
        description: '300×250, 728×90, and 160×600 variants for the Google Display Network campaign.',
        status: 'In Review', priority: 'High', labels: ['Design', 'Ads'],
        project: p2._id, assignedTo: alex._id, createdBy: demoUser._id,
        dueDate: daysAgo(3),   // OVERDUE
      },
      {
        title: 'Setup Meta & Google tracking pixels',
        description: 'Verify pixel firing on landing page, checkout, and thank-you pages. Check in GTM.',
        status: 'To Do', priority: 'Urgent', labels: ['Analytics'],
        project: p2._id, assignedTo: demoUser._id, createdBy: demoUser._id,
        dueDate: daysAgo(1),   // OVERDUE
      },
      {
        title: 'A/B test landing page hero',
        description: 'Test two hero headline variants against control. Min 1,000 sessions per variant.',
        status: 'To Do', priority: 'Medium', labels: ['Growth'],
        project: p2._id, assignedTo: priya._id, createdBy: demoUser._id,
        dueDate: daysFrom(2),
      },

      // ── PROJECT 3 ──
      {
        title: 'Migrate /auth endpoints to GraphQL',
        description: 'Login, signup, refresh, and logout mutations with proper error types.',
        status: 'Done', priority: 'High', labels: ['Backend', 'GraphQL'],
        project: p3._id, assignedTo: mike._id, createdBy: demoUser._id,
        dueDate: daysAgo(4),
      },
      {
        title: 'Add WebSocket real-time notifications',
        description: 'Socket.io integration. Emit events on task assign and project member add.',
        status: 'In Progress', priority: 'High', labels: ['Backend', 'Realtime'],
        project: p3._id, assignedTo: demoUser._id, createdBy: demoUser._id,
        dueDate: daysFrom(3),
      },
      {
        title: 'Rate limiting & DDoS protection',
        description: 'Implement per-route rate limits. Integrate with Cloudflare WAF for DDoS mitigation.',
        status: 'In Progress', priority: 'Urgent', labels: ['Backend', 'Security'],
        project: p3._id, assignedTo: mike._id, createdBy: demoUser._id,
        dueDate: daysFrom(1),
      },
      {
        title: 'Database indexing audit',
        description: 'Analyze slow query logs. Add compound indexes for common filter patterns.',
        status: 'To Do', priority: 'Medium', labels: ['Database', 'Performance'],
        project: p3._id, assignedTo: sarah._id, createdBy: demoUser._id,
        dueDate: daysFrom(6),
      },
      {
        title: 'API documentation (OpenAPI 3.0)',
        description: 'Auto-generate Swagger docs from JSDoc annotations. Host at /api/docs.',
        status: 'To Do', priority: 'Low', labels: ['Documentation'],
        project: p3._id, assignedTo: priya._id, createdBy: demoUser._id,
        dueDate: daysFrom(14),
      },
      {
        title: 'Write integration tests for task endpoints',
        description: 'Cover CRUD, RBAC edge cases, and pagination using Jest + Supertest.',
        status: 'To Do', priority: 'Medium', labels: ['Testing'],
        project: p3._id, assignedTo: sarah._id, createdBy: demoUser._id,
        dueDate: daysFrom(10),
      },
    ]);

    // ── 6. Demo Notifications ────────────────────────────────────────────────
    console.log('🔔 Creating notifications for demo user...');

    await Notification.insertMany([
      {
        user: demoUser._id,
        type: 'task_assigned',
        title: 'New Task Assigned to You',
        message: 'Alex Rivera assigned you "Redesign Dashboard with smart widgets" — due today!',
        read: false,
        createdAt: daysAgo(0),
      },
      {
        user: demoUser._id,
        type: 'task_overdue',
        title: '🔴 Task Overdue',
        message: '"Fix mobile navigation overflow" was due 2 days ago and is still open.',
        read: false,
        createdAt: daysAgo(0),
      },
      {
        user: demoUser._id,
        type: 'task_overdue',
        title: '🔴 Task Overdue',
        message: '"Setup Meta & Google tracking pixels" is 1 day overdue. Immediate attention needed.',
        read: false,
        createdAt: daysAgo(1),
      },
      {
        user: demoUser._id,
        type: 'member_added',
        title: 'Added to Backend API v3',
        message: 'Sarah Chen added you as Admin to "Backend API v3". You can now manage this project.',
        read: false,
        createdAt: daysAgo(2),
      },
      {
        user: demoUser._id,
        type: 'task_due_soon',
        title: '⏰ Due Tomorrow',
        message: '"Update Navbar with notifications" is due tomorrow. Mark it done if complete!',
        read: false,
        createdAt: daysAgo(1),
      },
      {
        user: demoUser._id,
        type: 'task_assigned',
        title: 'Task Assigned to You',
        message: 'Mike Johnson assigned you "Add WebSocket real-time notifications" in Backend API v3.',
        read: true,
        createdAt: daysAgo(3),
      },
      {
        user: demoUser._id,
        type: 'member_added',
        title: 'Added to Q3 Marketing Campaign',
        message: 'Priya Sharma added you to "Q3 Marketing Campaign" as Admin.',
        read: true,
        createdAt: daysAgo(5),
      },
      {
        user: demoUser._id,
        type: 'task_due_soon',
        title: '⏰ Deadline This Week',
        message: '"Rate limiting & DDoS protection" is due in 3 days. Keep it moving!',
        read: true,
        createdAt: daysAgo(2),
      },
    ]);

    console.log('\n✅ Demo data seeded successfully!');
    console.log('──────────────────────────────────────');
    console.log('  📧 Email:    demo@taskflow.com');
    console.log('  🔑 Password: password123');
    console.log('  📁 Projects: 3  (TaskFlow Redesign, Q3 Marketing, Backend API v3)');
    console.log('  👥 Team:     5  (Demo + Alex, Sarah, Mike, Priya)');
    console.log('  📋 Tasks:    20 (mix of Done/In Progress/In Review/To Do)');
    console.log('  🔴 Overdue:  3  tasks');
    console.log('  🔔 Notifs:   8  (5 unread, 3 read)');
    console.log('──────────────────────────────────────\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedData();
