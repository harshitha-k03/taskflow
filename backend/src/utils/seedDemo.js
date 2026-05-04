require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const TeamMember = require('../models/TeamMember');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

// ─── helpers ────────────────────────────────────────────────────────────────
const daysAgo  = (n) => new Date(Date.now() - n * 86400000);
const daysFrom = (n) => new Date(Date.now() + n * 86400000);
const hoursAgo = (h) => new Date(Date.now() - h * 3600000);
const minsAgo  = (m) => new Date(Date.now() - m * 60000);
const getDmChannel = (id1, id2) => `dm:${[id1.toString(), id2.toString()].sort().join('_')}`;

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
      await User.findByIdAndUpdate(demoUser._id, {
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser',
        'availability.status': 'available',
      });
    } else {
      console.log('👤 Creating demo user...');
      demoUser = await User.create({
        name: 'Demo User',
        email: 'demo@taskflow.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser',
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
          name: def.name, email: def.email, password: 'password123',
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
      { name: 'TaskFlow v2.0 Redesign', description: 'Complete overhaul of the UI with a new design system, dark mode, and improved mobile experience.', color: '#6366f1', status: 'Active', startDate: daysAgo(14), endDate: daysFrom(21), creator: demoUser._id },
      { name: 'Q3 Marketing Campaign', description: 'Multi-channel marketing push for the Q3 product launch covering email, social, and paid ads.', color: '#f59e0b', status: 'Active', startDate: daysAgo(30), endDate: daysAgo(2), creator: demoUser._id },
      { name: 'Backend API v3', description: 'Migrate REST endpoints to GraphQL, add WebSocket support, and improve rate limiting.', color: '#10b981', status: 'Active', startDate: daysAgo(5), endDate: daysFrom(30), creator: demoUser._id },
    ]);

    // ── 4. Team Members per Project ─────────────────────────────────────────
    await TeamMember.insertMany([
      { project: p1._id, user: demoUser._id, role: 'Admin' }, { project: p1._id, user: alex._id, role: 'Member' },
      { project: p1._id, user: sarah._id, role: 'Member' }, { project: p1._id, user: mike._id, role: 'Member' },
      { project: p2._id, user: demoUser._id, role: 'Admin' }, { project: p2._id, user: alex._id, role: 'Member' },
      { project: p2._id, user: priya._id, role: 'Member' },
      { project: p3._id, user: demoUser._id, role: 'Admin' }, { project: p3._id, user: sarah._id, role: 'Member' },
      { project: p3._id, user: mike._id, role: 'Member' }, { project: p3._id, user: priya._id, role: 'Member' },
    ]);

    // ── 5. Tasks ─────────────────────────────────────────────────────────────
    console.log('📋 Creating tasks...');

    await Task.insertMany([
      { title: 'Design new color palette & token system', status: 'Done', priority: 'High', labels: ['Design'], project: p1._id, assignedTo: sarah._id, createdBy: demoUser._id, dueDate: daysAgo(10) },
      { title: 'Build reusable Button component', status: 'Done', priority: 'High', labels: ['Frontend'], project: p1._id, assignedTo: alex._id, createdBy: demoUser._id, dueDate: daysAgo(8) },
      { title: 'Implement dark mode toggle', status: 'Done', priority: 'Medium', labels: ['Frontend'], project: p1._id, assignedTo: demoUser._id, createdBy: demoUser._id, dueDate: daysAgo(5) },
      { title: 'Update Navbar with notifications', status: 'In Review', priority: 'High', labels: ['Frontend'], project: p1._id, assignedTo: alex._id, createdBy: demoUser._id, dueDate: daysFrom(1) },
      { title: 'Redesign Dashboard with smart widgets', status: 'In Progress', priority: 'Urgent', labels: ['Frontend', 'UX'], project: p1._id, assignedTo: demoUser._id, createdBy: demoUser._id, dueDate: new Date() },
      { title: 'Accessibility audit (WCAG 2.1)', status: 'To Do', priority: 'Medium', labels: ['QA'], project: p1._id, assignedTo: mike._id, createdBy: demoUser._id, dueDate: daysFrom(4) },
      { title: 'Fix mobile navigation overflow', status: 'To Do', priority: 'Urgent', labels: ['Bug'], project: p1._id, assignedTo: demoUser._id, createdBy: alex._id, dueDate: daysAgo(2) },
      { title: 'Write component documentation', status: 'To Do', priority: 'Low', labels: ['Documentation'], project: p1._id, assignedTo: null, createdBy: demoUser._id, dueDate: daysFrom(12) },
      { title: 'Performance benchmarking', status: 'To Do', priority: 'Medium', labels: ['Performance'], project: p1._id, assignedTo: mike._id, createdBy: demoUser._id, dueDate: daysFrom(7) },
      { title: 'Finalize email drip copy', status: 'Done', priority: 'Medium', labels: ['Copywriting'], project: p2._id, assignedTo: demoUser._id, createdBy: demoUser._id, dueDate: daysAgo(15) },
      { title: 'Design Q3 social media kit', status: 'Done', priority: 'High', labels: ['Design'], project: p2._id, assignedTo: priya._id, createdBy: demoUser._id, dueDate: daysAgo(12) },
      { title: 'Design Google Display banner ads', status: 'In Review', priority: 'High', labels: ['Design'], project: p2._id, assignedTo: alex._id, createdBy: demoUser._id, dueDate: daysAgo(3) },
      { title: 'Setup Meta & Google tracking pixels', status: 'To Do', priority: 'Urgent', labels: ['Analytics'], project: p2._id, assignedTo: demoUser._id, createdBy: demoUser._id, dueDate: daysAgo(1) },
      { title: 'A/B test landing page hero', status: 'To Do', priority: 'Medium', labels: ['Growth'], project: p2._id, assignedTo: priya._id, createdBy: demoUser._id, dueDate: daysFrom(2) },
      { title: 'Migrate /auth endpoints to GraphQL', status: 'Done', priority: 'High', labels: ['Backend'], project: p3._id, assignedTo: mike._id, createdBy: demoUser._id, dueDate: daysAgo(4) },
      { title: 'Add WebSocket real-time notifications', status: 'In Progress', priority: 'High', labels: ['Backend'], project: p3._id, assignedTo: demoUser._id, createdBy: demoUser._id, dueDate: daysFrom(3) },
      { title: 'Rate limiting & DDoS protection', status: 'In Progress', priority: 'Urgent', labels: ['Security'], project: p3._id, assignedTo: mike._id, createdBy: demoUser._id, dueDate: daysFrom(1) },
      { title: 'Database indexing audit', status: 'To Do', priority: 'Medium', labels: ['Database'], project: p3._id, assignedTo: sarah._id, createdBy: demoUser._id, dueDate: daysFrom(6) },
      { title: 'API documentation (OpenAPI 3.0)', status: 'To Do', priority: 'Low', labels: ['Documentation'], project: p3._id, assignedTo: priya._id, createdBy: demoUser._id, dueDate: daysFrom(14) },
      { title: 'Write integration tests for task endpoints', status: 'To Do', priority: 'Medium', labels: ['Testing'], project: p3._id, assignedTo: sarah._id, createdBy: demoUser._id, dueDate: daysFrom(10) },
    ]);

    // ── 6. Notifications ─────────────────────────────────────────────────────
    console.log('🔔 Creating notifications...');

    await Notification.insertMany([
      { user: demoUser._id, type: 'task_assigned', title: 'New Task Assigned', message: 'Alex assigned you "Redesign Dashboard" — due today!', read: false, createdAt: daysAgo(0) },
      { user: demoUser._id, type: 'task_overdue', title: '🔴 Task Overdue', message: '"Fix mobile nav overflow" was due 2 days ago.', read: false, createdAt: daysAgo(0) },
      { user: demoUser._id, type: 'task_overdue', title: '🔴 Task Overdue', message: '"Setup tracking pixels" is 1 day overdue.', read: false, createdAt: daysAgo(1) },
      { user: demoUser._id, type: 'member_added', title: 'Added to Backend API v3', message: 'Sarah added you as Admin.', read: false, createdAt: daysAgo(2) },
      { user: demoUser._id, type: 'task_due_soon', title: '⏰ Due Tomorrow', message: '"Update Navbar with notifications" is due tomorrow.', read: false, createdAt: daysAgo(1) },
      { user: demoUser._id, type: 'task_assigned', title: 'Task Assigned', message: 'Mike assigned you "WebSocket notifications".', read: true, createdAt: daysAgo(3) },
      { user: demoUser._id, type: 'member_added', title: 'Added to Q3 Marketing', message: 'Priya added you as Admin.', read: true, createdAt: daysAgo(5) },
      { user: demoUser._id, type: 'task_due_soon', title: '⏰ Deadline This Week', message: '"Rate limiting" is due in 3 days.', read: true, createdAt: daysAgo(2) },
    ]);

    // ── 7. Demo Chat Messages ────────────────────────────────────────────────
    console.log('💬 Creating demo chat messages...');

    const allIds = [demoUser._id, alex._id, sarah._id, mike._id, priya._id];

    const tc1 = `team:${p1._id}`, tc2 = `team:${p2._id}`, tc3 = `team:${p3._id}`;
    const dA = getDmChannel(demoUser._id, alex._id);
    const dS = getDmChannel(demoUser._id, sarah._id);
    const dM = getDmChannel(demoUser._id, mike._id);
    const dP = getDmChannel(demoUser._id, priya._id);
    // Also DMs between demo team members (not involving real users)
    const demoOnlyDMs = [
      getDmChannel(alex._id, sarah._id), getDmChannel(alex._id, mike._id),
      getDmChannel(alex._id, priya._id), getDmChannel(sarah._id, mike._id),
      getDmChannel(sarah._id, priya._id), getDmChannel(mike._id, priya._id),
    ];

    const demoChannels = [tc1, tc2, tc3, dA, dS, dM, dP, ...demoOnlyDMs];
    await Message.deleteMany({ channel: { $in: demoChannels } });

    await Message.insertMany([
      // ── Team: TaskFlow v2.0 Redesign ──
      { sender: demoUser._id, channel: tc1, text: 'Hey team! Kicking off the v2.0 redesign. Let\'s start with design tokens.', createdAt: hoursAgo(48), readBy: allIds },
      { sender: sarah._id, channel: tc1, text: 'Color palette is ready — uploaded the Figma file. Primary indigo-600, secondary emerald-500 🎨', createdAt: hoursAgo(47), readBy: allIds },
      { sender: alex._id, channel: tc1, text: 'Love it Sarah! I\'ll start the Button component based on those tokens.', createdAt: hoursAgo(46), readBy: allIds },
      { sender: mike._id, channel: tc1, text: 'Heads up — mobile nav is broken on iPhone SE. Filed it as urgent.', createdAt: hoursAgo(24), readBy: allIds },
      { sender: demoUser._id, channel: tc1, text: 'Thanks Mike, I\'ll prioritize the mobile fix. Dark mode toggle is done ✅', createdAt: hoursAgo(23), readBy: allIds },
      { sender: alex._id, channel: tc1, text: 'Navbar notifications PR is ready for review! Bell badge + dropdown panel done.', createdAt: hoursAgo(4), readBy: [alex._id] },
      { sender: sarah._id, channel: tc1, text: 'Reviewed it Alex — looks great! Left a comment about animation timing.', createdAt: hoursAgo(3), readBy: [sarah._id, alex._id] },
      { sender: demoUser._id, channel: tc1, text: 'Great work everyone! Dashboard redesign almost done. Standup at 10am tomorrow?', createdAt: hoursAgo(1), readBy: [demoUser._id] },

      // ── Team: Q3 Marketing ──
      { sender: demoUser._id, channel: tc2, text: 'Q3 campaign deadline was yesterday... where are we on tracking pixels?', createdAt: hoursAgo(26), readBy: allIds },
      { sender: alex._id, channel: tc2, text: 'Banner ads in review — 3 size variants ready. Waiting on brand approval for CTA color.', createdAt: hoursAgo(25), readBy: allIds },
      { sender: priya._id, channel: tc2, text: 'Social media kit is complete! All templates uploaded to shared drive 📁', createdAt: hoursAgo(22), readBy: allIds },
      { sender: demoUser._id, channel: tc2, text: 'Awesome Priya! I still need to set up Meta pixel. Will do it today.', createdAt: hoursAgo(20), readBy: allIds },
      { sender: alex._id, channel: tc2, text: 'Got brand approval on banners! Pushing to Google Display Network now 🚀', createdAt: hoursAgo(5), readBy: [alex._id] },

      // ── Team: Backend API v3 ──
      { sender: mike._id, channel: tc3, text: 'Auth migration to GraphQL is complete! All mutations passing tests.', createdAt: hoursAgo(36), readBy: allIds },
      { sender: sarah._id, channel: tc3, text: 'Nice Mike! I\'ll start DB indexing audit next week. Any slow queries to prioritize?', createdAt: hoursAgo(35), readBy: allIds },
      { sender: mike._id, channel: tc3, text: 'Check task listing endpoint — doing a full collection scan on filtered queries.', createdAt: hoursAgo(34), readBy: allIds },
      { sender: demoUser._id, channel: tc3, text: 'Working on WebSocket notifications. Should have a prototype by end of day.', createdAt: hoursAgo(12), readBy: allIds },
      { sender: priya._id, channel: tc3, text: 'I\'ll start OpenAPI docs once endpoints stabilize. Using swagger-jsdoc.', createdAt: hoursAgo(8), readBy: allIds },
      { sender: mike._id, channel: tc3, text: 'Rate limiting almost done — express-rate-limit with Redis store for distributed counting 🔒', createdAt: hoursAgo(2), readBy: [mike._id] },

      // ── DM: Demo ↔ Alex ──
      { sender: alex._id, channel: dA, text: 'Hey! Can you review my navbar PR when you get a chance?', createdAt: hoursAgo(6), readBy: [alex._id] },
      { sender: demoUser._id, channel: dA, text: 'Sure! I\'ll check after lunch. Did you add the notification badge animation?', createdAt: hoursAgo(5.5), readBy: [demoUser._id, alex._id] },
      { sender: alex._id, channel: dA, text: 'Yep, subtle scale + pulse. Also added unread count capped at 9+', createdAt: hoursAgo(5), readBy: [alex._id] },
      { sender: demoUser._id, channel: dA, text: 'Perfect, exactly the Slack-style pattern we wanted 👍', createdAt: hoursAgo(4.5), readBy: [demoUser._id, alex._id] },
      { sender: alex._id, channel: dA, text: 'Banner ad got brand approval! Pushing to Google Display now', createdAt: minsAgo(30), readBy: [alex._id] },

      // ── DM: Demo ↔ Sarah ──
      { sender: sarah._id, channel: dS, text: 'Color tokens exported as CSS custom properties + Tailwind config. Want a walkthrough?', createdAt: hoursAgo(40), readBy: allIds },
      { sender: demoUser._id, channel: dS, text: 'That\'d be great! Quick 15-min call tomorrow?', createdAt: hoursAgo(39), readBy: allIds },
      { sender: sarah._id, channel: dS, text: 'Works for me! 10:30am? I\'ll show the Figma → code pipeline', createdAt: hoursAgo(38), readBy: allIds },
      { sender: demoUser._id, channel: dS, text: '10:30 works 👍 see you then!', createdAt: hoursAgo(37), readBy: allIds },

      // ── DM: Demo ↔ Mike ──
      { sender: mike._id, channel: dM, text: 'Found critical bug — mobile hamburger overflows on small screens. Logged as urgent.', createdAt: hoursAgo(26), readBy: allIds },
      { sender: demoUser._id, channel: dM, text: 'Thanks for catching that! Only iPhone SE or other small devices too?', createdAt: hoursAgo(25), readBy: allIds },
      { sender: mike._id, channel: dM, text: 'SE and Galaxy Fold — anything under 375px. Nav items need overflow-hidden + scroll.', createdAt: hoursAgo(24), readBy: allIds },
      { sender: mike._id, channel: dM, text: 'Rate limiting PR is up for review whenever you\'re free 🔒', createdAt: minsAgo(45), readBy: [mike._id] },

      // ── DM: Demo ↔ Priya ──
      { sender: priya._id, channel: dP, text: 'Hey! I\'m OOO this week but I\'ll finish the A/B test setup when back Monday.', createdAt: hoursAgo(30), readBy: allIds },
      { sender: demoUser._id, channel: dP, text: 'No worries Priya! Enjoy your time off 🌴', createdAt: hoursAgo(29), readBy: allIds },
      { sender: priya._id, channel: dP, text: 'Thanks! Left notes in the API docs task about swagger-jsdoc config. Sarah can pick it up.', createdAt: hoursAgo(28), readBy: allIds },
    ]);

    console.log('\n✅ Demo data seeded successfully!');
    console.log('──────────────────────────────────────');
    console.log('  📧 Email:    demo@taskflow.com');
    console.log('  🔑 Password: password123');
    console.log('  📁 Projects: 3');
    console.log('  👥 Team:     5  (Demo + Alex, Sarah, Mike, Priya)');
    console.log('  📋 Tasks:    20');
    console.log('  🔔 Notifs:   8  (5 unread, 3 read)');
    console.log('  💬 Chats:    3 team channels + 4 DM conversations');
    console.log('──────────────────────────────────────\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedData();
