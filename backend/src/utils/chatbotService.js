/**
 * Chatbot Service
 *
 * Context-aware AI assistant for TaskFlow.
 * Queries MongoDB for relevant user data, builds a structured prompt,
 * and calls the LLM via the key rotator with automatic fallback.
 */

const Task = require('../models/Task');
const Project = require('../models/Project');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const keyRotator = require('./aiKeyRotator');

// ── LLM API callers ────────────────────────────────────────────────────────

async function callGroq(apiKey, model, messages) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (res.status === 429) {
    const err = new Error('Rate limited');
    err.status = 429;
    throw err;
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

async function callGemini(apiKey, model, messages) {
  // Convert OpenAI-style messages to Gemini format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Prepend system instruction as a user message if present
  const systemMsg = messages.find((m) => m.role === 'system');
  if (systemMsg) {
    contents.unshift({
      role: 'user',
      parts: [{ text: `[System Instructions]\n${systemMsg.content}` }],
    });
    // Add a model acknowledgment so the conversation alternates correctly
    contents.splice(1, 0, {
      role: 'model',
      parts: [{ text: 'Understood. I will follow these instructions.' }],
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (res.status === 429) {
    const err = new Error('Rate limited');
    err.status = 429;
    throw err;
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Sorry, I could not generate a response.'
  );
}

// ── Context builder ────────────────────────────────────────────────────────

async function buildUserContext(userId) {
  const memberships = await TeamMember.find({ user: userId }).select('project role');
  const projectIds = memberships.map((m) => m.project);

  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [projects, myTasks, teamMembers, completedThisWeek, totalTasks] =
    await Promise.all([
      Project.find({ _id: { $in: projectIds } })
        .select('name status color')
        .lean(),

      Task.find({
        project: { $in: projectIds },
        assignedTo: userId,
        status: { $ne: 'Done' },
      })
        .populate('project', 'name')
        .sort('dueDate')
        .lean(),

      TeamMember.find({ project: { $in: projectIds } })
        .populate('user', 'name email availability')
        .lean(),

      Task.countDocuments({
        project: { $in: projectIds },
        status: 'Done',
        completedAt: { $gte: weekAgo },
      }),

      Task.countDocuments({ project: { $in: projectIds } }),
    ]);

  // Unique team members
  const seen = new Set();
  const uniqueTeam = teamMembers
    .filter((m) => {
      if (!m.user || seen.has(String(m.user._id))) return false;
      seen.add(String(m.user._id));
      return true;
    })
    .map((m) => ({
      name: m.user.name,
      email: m.user.email,
      availability: m.user.availability?.status || 'available',
    }));

  // Task summaries
  const overdueTasks = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now
  );
  const dueTodayTasks = myTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.toDateString() === now.toDateString();
  });
  const urgentTasks = myTasks.filter((t) => t.priority === 'Urgent' || t.priority === 'High');

  // Build concise context string
  let context = `=== TASKFLOW CONTEXT (as of ${now.toISOString()}) ===\n`;
  context += `\nPROJECTS (${projects.length}):\n`;
  projects.forEach((p) => {
    context += `  - "${p.name}" [${p.status}]\n`;
  });

  context += `\nYOUR OPEN TASKS (${myTasks.length}):\n`;
  myTasks.slice(0, 15).forEach((t) => {
    const due = t.dueDate
      ? ` | Due: ${new Date(t.dueDate).toLocaleDateString()}`
      : '';
    const overdue =
      t.dueDate && new Date(t.dueDate) < now ? ' ⚠️ OVERDUE' : '';
    context += `  - "${t.title}" [${t.status}] [${t.priority}]${due}${overdue} (Project: ${t.project?.name || 'Unknown'})\n`;
  });
  if (myTasks.length > 15) context += `  ... and ${myTasks.length - 15} more\n`;

  context += `\nSUMMARY:\n`;
  context += `  - Overdue tasks: ${overdueTasks.length}\n`;
  context += `  - Due today: ${dueTodayTasks.length}\n`;
  context += `  - Urgent/High priority: ${urgentTasks.length}\n`;
  context += `  - Completed this week: ${completedThisWeek}\n`;
  context += `  - Total tasks across projects: ${totalTasks}\n`;

  context += `\nTEAM MEMBERS (${uniqueTeam.length}):\n`;
  uniqueTeam.slice(0, 10).forEach((m) => {
    context += `  - ${m.name} (${m.email}) — ${m.availability}\n`;
  });

  return context;
}

// ── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are TaskBot, the AI assistant for TaskFlow — a team project management application.

CRITICAL — YOU ARE READ-ONLY:
- You can ONLY read and report on existing data shown in the context below.
- You CANNOT create, update, delete, or modify ANY projects, tasks, deadlines, or team members.
- You have NO ability to make changes to the system whatsoever.
- If a user asks you to create a project, add a task, change a deadline, assign someone, or any write operation, you MUST respond:
  "I can only view your data — I can't make changes. Please use the TaskFlow app directly to [create/update/delete] that."
- NEVER pretend or imply that you performed an action. NEVER say "Done!", "Created!", "Updated!" etc.

Your capabilities (READ-ONLY):
- Answer questions about the user's tasks, projects, deadlines, and team
- Provide insights from their project data (completion rates, workload, overdue items)
- Give productivity suggestions based on their current workload
- Help with general project management advice

Formatting rules:
- Be concise and helpful. Keep responses under 200 words.
- Use **bold text** and bullet points for clarity.
- Do NOT use markdown headings (# ## ###). Use **bold text** instead for section titles.
- Use emoji sparingly for visual clarity (✅ ⚠️ 📋 etc).
- When referencing tasks or projects, use their exact names from the context.
- If asked about data not in the context, say so honestly.
- Never make up task names, deadlines, or team members.`;

// ── Main chat function ─────────────────────────────────────────────────────

/**
 * Process a chatbot message and return AI response.
 * @param {string} userId - The authenticated user's ID
 * @param {string} message - User's message
 * @param {Array} conversationHistory - Previous messages [{role, content}]
 * @returns {Promise<{reply: string, provider: string}>}
 */
async function chat(userId, message, conversationHistory = []) {
  // 1. Build context from user's data
  const context = await buildUserContext(userId);

  // 2. Construct messages array
  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${context}` },
    ...conversationHistory.slice(-6), // Keep last 6 messages for context window
    { role: 'user', content: message },
  ];

  // 3. Try calling LLM with key rotation + fallback
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const keyInfo = keyRotator.getNextKey();
    if (!keyInfo) break; // All keys exhausted

    try {
      let reply;
      if (keyInfo.provider === 'groq') {
        reply = await callGroq(keyInfo.key, keyInfo.model, messages);
      } else {
        reply = await callGemini(keyInfo.key, keyInfo.model, messages);
      }
      return { reply, provider: keyInfo.provider };
    } catch (err) {
      lastError = err;
      if (err.status === 429) {
        keyRotator.markCooldown(keyInfo.provider, keyInfo.key, 60);
        continue; // Try next key
      }
      // Non-rate-limit error — still try next key
      console.error(`AI call failed (${keyInfo.provider}):`, err.message);
      keyRotator.markCooldown(keyInfo.provider, keyInfo.key, 30);
    }
  }

  // All keys exhausted
  console.error('All AI keys exhausted:', lastError?.message);
  return {
    reply:
      "⚠️ I'm experiencing high demand right now. Please try again in a minute!\n\nIn the meantime, you can check your dashboard for task summaries and deadlines.",
    provider: 'none',
  };
}

module.exports = { chat };
