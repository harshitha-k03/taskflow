require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const TeamMember = require('../models/TeamMember');
const Task = require('../models/Task');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // 1. Setup Demo User
    let demoUser = await User.findOne({ email: 'demo@taskflow.com' });
    
    if (demoUser) {
      console.log('Removing old demo data...');
      // Clean up existing projects and tasks owned by demo user
      const projects = await Project.find({ creator: demoUser._id });
      const projectIds = projects.map(p => p._id);
      
      await Task.deleteMany({ project: { $in: projectIds } });
      await TeamMember.deleteMany({ project: { $in: projectIds } });
      await Project.deleteMany({ creator: demoUser._id });
    } else {
      console.log('Creating demo user...');
      demoUser = await User.create({
        name: 'Demo User',
        email: 'demo@taskflow.com',
        password: 'password123'
      });
    }

    // 2. Setup Dummy Team Members
    const avatars = [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
    ];

    let alex = await User.findOne({ email: 'alex@taskflow.com' });
    if (!alex) alex = await User.create({ name: 'Alex Rivera', email: 'alex@taskflow.com', password: 'password123', avatar: avatars[0] });
    
    let sarah = await User.findOne({ email: 'sarah@taskflow.com' });
    if (!sarah) sarah = await User.create({ name: 'Sarah Chen', email: 'sarah@taskflow.com', password: 'password123', avatar: avatars[1] });

    // 3. Create Projects
    console.log('Creating projects...');
    const now = new Date();
    
    const project1 = await Project.create({
      name: 'TaskFlow Redesign',
      description: 'Overhauling the user interface with modern design tokens and improved accessibility features.',
      color: '#0ea5e9',
      status: 'Active',
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      creator: demoUser._id
    });

    const project2 = await Project.create({
      name: 'Q3 Marketing Campaign',
      description: 'Assets and strategy for the upcoming Q3 product launch on social media channels.',
      color: '#f59e0b',
      status: 'Active',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
      creator: demoUser._id
    });

    // Add members
    await TeamMember.create([
      { project: project1._id, user: demoUser._id, role: 'Admin' },
      { project: project1._id, user: alex._id, role: 'Member' },
      { project: project1._id, user: sarah._id, role: 'Member' },
      
      { project: project2._id, user: demoUser._id, role: 'Admin' },
      { project: project2._id, user: alex._id, role: 'Member' }
    ]);

    // 4. Create Tasks
    console.log('Creating tasks...');
    
    const project1Tasks = [
      {
        title: 'Create new color palette',
        description: 'Define the new primary, secondary, and neutral color scales according to the branding guidelines.',
        status: 'Done',
        priority: 'High',
        labels: ['Design', 'Branding'],
        project: project1._id,
        assignedTo: sarah._id,
        createdBy: demoUser._id,
        dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Update component library',
        description: 'Apply the new color palette to all existing React components in the shared library.',
        status: 'In Review',
        priority: 'High',
        labels: ['Development', 'Frontend'],
        project: project1._id,
        assignedTo: alex._id,
        createdBy: demoUser._id,
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Accessibility audit',
        description: 'Run lighthouse and manual screen reader testing on the updated components.',
        status: 'In Progress',
        priority: 'Medium',
        labels: ['QA', 'A11y'],
        project: project1._id,
        assignedTo: demoUser._id,
        createdBy: demoUser._id,
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Fix mobile navigation overflow',
        description: 'The hamburger menu items are overflowing on screens smaller than 375px.',
        status: 'To Do',
        priority: 'Urgent',
        labels: ['Bug', 'Mobile'],
        project: project1._id,
        assignedTo: demoUser._id,
        createdBy: alex._id,
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day overdue
      },
      {
        title: 'Write release notes',
        description: 'Draft the changelog and release notes for the new UI update.',
        status: 'To Do',
        priority: 'Low',
        labels: ['Documentation'],
        project: project1._id,
        assignedTo: null,
        createdBy: demoUser._id,
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
      }
    ];

    const project2Tasks = [
      {
        title: 'Finalize email copy',
        description: 'Approve the final drafts for the 3-part email drip campaign.',
        status: 'Done',
        priority: 'Medium',
        labels: ['Copywriting'],
        project: project2._id,
        assignedTo: demoUser._id,
        createdBy: demoUser._id,
        dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Design banner ads',
        description: 'Create 300x250 and 728x90 banner variations for Google Display Network.',
        status: 'In Review',
        priority: 'High',
        labels: ['Design', 'Ads'],
        project: project2._id,
        assignedTo: alex._id,
        createdBy: demoUser._id,
        dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days overdue
      },
      {
        title: 'Setup tracking pixels',
        description: 'Ensure Meta and Google tracking pixels are firing correctly on the landing page.',
        status: 'To Do',
        priority: 'Urgent',
        labels: ['Analytics'],
        project: project2._id,
        assignedTo: demoUser._id,
        createdBy: demoUser._id,
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day overdue
      }
    ];

    await Task.insertMany([...project1Tasks, ...project2Tasks]);
    
    console.log('✅ Demo data seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed:', err);
    process.exit(1);
  }
};

seedData();
