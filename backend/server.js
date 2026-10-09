const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const seedDatabase = require('./seed');

const app = express();
const PORT = process.env.PORT || 5001;
const DEFAULT_NOW = '2026-10-03T16:00:00Z';

// In-memory proposal store backed by PostgreSQL where available
const pendingProposalsStore = new Map();

app.use(cors());
app.use(express.json());

// Helper function to validate YYYY-MM-DD date format and check valid calendar date
function parseValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
    return d;
  }
  return null;
}

// Helper to get calendar date YYYY-MM-DD in a specific timezone
function getCalendarDateInTimezone(dateObj, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(dateObj);
  } catch (e) {
    return dateObj.toISOString().split('T')[0];
  }
}

// Helper to calculate difference in full calendar days between dateStr1 and dateStr2 (dateStr1 - dateStr2)
function getDaysDiff(dateStr1, dateStr2) {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

// Helper to add days to a YYYY-MM-DD date string
function addDaysToDateStr(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + Number(days));
  return date.toISOString().split('T')[0];
}

// Format application row from DB to frontend camelCase model
function formatApplicationRow(row, nowInput = DEFAULT_NOW) {
  const parsedDate = parseValidDate(row.last_activity_date);
  const isInvalidDate = Boolean(row.last_activity_date && !parsedDate);

  let followUpDueDate = null;
  let isFollowUpOverdue = false;

  const referenceDate = new Date(nowInput || DEFAULT_NOW);
  const refDay = new Date(referenceDate);
  refDay.setHours(0, 0, 0, 0);

  if (parsedDate && row.follow_up_after_days) {
    const due = new Date(parsedDate);
    due.setDate(due.getDate() + Number(row.follow_up_after_days));
    followUpDueDate = due.toISOString().split('T')[0];
    
    if (due < refDay && ['applied', 'interviewing'].includes(row.status)) {
      isFollowUpOverdue = true;
    }
  }

  let parsedDeadline = parseValidDate(row.deadline);
  let isDeadlineOverdue = false;
  if (parsedDeadline) {
    if (parsedDeadline < refDay && ['saved', 'applied', 'interviewing', 'offer'].includes(row.status)) {
      isDeadlineOverdue = true;
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || null,
    userTimezone: row.user_timezone || null,
    company: row.company,
    role: row.role,
    status: row.status,
    lastActivityDate: row.last_activity_date,
    followUpAfterDays: row.follow_up_after_days,
    deadline: row.deadline,
    notes: row.notes || '',
    createdAt: row.created_at,
    referenceNow: referenceDate.toISOString(),
    isInvalidDate,
    followUpDueDate,
    isFollowUpOverdue,
    isDeadlineOverdue
  };
}

// Helper to determine 'now' value from request query or body
function getNowFromRequest(req) {
  return req.query.now || req.body?.now || DEFAULT_NOW;
}

// Helper to extract authenticated user ID from X-User-Id header
function getAuthUserId(req) {
  return req.headers['x-user-id'] || req.query.userId || req.body?.userId || null;
}

// Handler logic for GET /follow-ups (Tool: listFollowUps)
async function handleGetFollowUps(req, res) {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const nowInput = getNowFromRequest(req);
  const referenceDate = new Date(nowInput || DEFAULT_NOW);

  try {
    let queryText = `
      SELECT a.*, u.timezone as user_timezone
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.status IN ('applied', 'interviewing')
    `;
    const queryParams = [];

    if (authUserId !== 'all') {
      queryParams.push(authUserId);
      queryText += ` AND a.user_id = $1`;
    }

    queryText += ` ORDER BY a.id ASC`;

    const result = await db.query(queryText, queryParams);
    
    const followUps = [];

    for (const row of result.rows) {
      const parsedLastActivity = parseValidDate(row.last_activity_date);
      if (!parsedLastActivity) continue;

      const userTimezone = row.user_timezone || 'UTC';
      const userTodayDateStr = getCalendarDateInTimezone(referenceDate, userTimezone);

      const followUpDays = Number(row.follow_up_after_days) || 7;
      const dueDateStr = addDaysToDateStr(row.last_activity_date, followUpDays);

      if (dueDateStr <= userTodayDateStr) {
        const daysOverdue = Math.max(0, getDaysDiff(userTodayDateStr, dueDateStr));
        const daysSinceLastActivity = getDaysDiff(userTodayDateStr, row.last_activity_date);

        const statusCap = row.status.charAt(0).toUpperCase() + row.status.slice(1);
        const reason = `${statusCap} ${daysSinceLastActivity} days ago with no follow-up`;

        followUps.push({
          id: row.id,
          company: row.company,
          role: row.role,
          status: row.status,
          dueDate: dueDateStr,
          daysOverdue: daysOverdue,
          reason: reason
        });
      }
    }

    res.json(followUps);
  } catch (err) {
    console.error('Error fetching follow-ups:', err);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
}

// Priority Ranking Tier Calculation Helper
function getPriorityTierAndScore(app, referenceNow, userTimezone) {
  const parsedLastActivity = parseValidDate(app.lastActivityDate);
  const parsedDeadline = parseValidDate(app.deadline);
  const userTodayDateStr = getCalendarDateInTimezone(new Date(referenceNow), userTimezone);

  let isFollowUpOverdue = false;
  let daysOverdue = 0;
  let dueDateStr = null;

  if (parsedLastActivity) {
    const followUpDays = Number(app.followUpAfterDays) || 7;
    dueDateStr = addDaysToDateStr(app.lastActivityDate, followUpDays);
    if (dueDateStr <= userTodayDateStr && ['applied', 'interviewing'].includes(app.status)) {
      isFollowUpOverdue = true;
      daysOverdue = Math.max(0, getDaysDiff(userTodayDateStr, dueDateStr));
    }
  }

  if (app.status === 'offer') {
    let daysUntilDeadline = 999;
    if (parsedDeadline) {
      daysUntilDeadline = getDaysDiff(app.deadline, userTodayDateStr);
    }
    return {
      tier: 1,
      subSortKey: daysUntilDeadline,
      reason: parsedDeadline
        ? `Offer pending with deadline on ${app.deadline} (${daysUntilDeadline <= 0 ? 'deadline passed' : `due in ${daysUntilDeadline} days`}). Decision required.`
        : `Offer received! High priority decision required.`
    };
  }

  if (app.status === 'interviewing' && isFollowUpOverdue) {
    return {
      tier: 2,
      subSortKey: -daysOverdue,
      reason: `Active interview stage with follow-up ${daysOverdue === 0 ? 'due today' : `${daysOverdue} day(s) overdue`} (due ${dueDateStr}).`
    };
  }

  if (app.status === 'applied' && isFollowUpOverdue) {
    return {
      tier: 3,
      subSortKey: -daysOverdue,
      reason: `Applied application with follow-up ${daysOverdue === 0 ? 'due today' : `${daysOverdue} day(s) overdue`} (due ${dueDateStr}).`
    };
  }

  if (app.status === 'interviewing') {
    return {
      tier: 4,
      subSortKey: 0,
      reason: `Active interviewing process in progress.`
    };
  }

  if (app.status === 'applied') {
    return {
      tier: 5,
      subSortKey: 0,
      reason: `Application submitted; awaiting response or follow-up window.`
    };
  }

  if (app.status === 'saved') {
    return {
      tier: 6,
      subSortKey: 0,
      reason: `Saved application draft waiting to be completed and submitted.`
    };
  }

  if (app.status === 'rejected') {
    return {
      tier: 7,
      subSortKey: 0,
      reason: `Application rejected; opportunity closed.`
    };
  }

  return { tier: 99, subSortKey: 0, reason: `Status: ${app.status}` };
}

// Handler logic for GET /follow-ups/priority
async function handleGetPriorityRanking(req, res) {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const nowInput = getNowFromRequest(req);
  const referenceDate = new Date(nowInput || DEFAULT_NOW);

  try {
    let queryText = `
      SELECT a.*, u.timezone as user_timezone
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (authUserId !== 'all') {
      queryParams.push(authUserId);
      queryText += ` AND a.user_id = $1`;
    }

    const result = await db.query(queryText, queryParams);
    
    const items = result.rows.map((row) => {
      const appObj = {
        id: row.id,
        company: row.company,
        role: row.role,
        status: row.status,
        lastActivityDate: row.last_activity_date,
        followUpAfterDays: row.follow_up_after_days,
        deadline: row.deadline,
        notes: row.notes
      };

      const priorityInfo = getPriorityTierAndScore(appObj, referenceDate, row.user_timezone || 'UTC');

      return {
        id: row.id,
        company: row.company,
        role: row.role,
        status: row.status,
        reason: priorityInfo.reason,
        _tier: priorityInfo.tier,
        _subSortKey: priorityInfo.subSortKey
      };
    });

    items.sort((a, b) => {
      if (a._tier !== b._tier) return a._tier - b._tier;
      return a._subSortKey - b._subSortKey;
    });

    const rankedOutput = items.map((item, index) => ({
      rank: index + 1,
      id: item.id,
      company: item.company,
      role: item.role,
      status: item.status,
      reason: item.reason
    }));

    res.json(rankedOutput);
  } catch (err) {
    console.error('Error computing priority ranking:', err);
    res.status(500).json({ error: 'Failed to compute priority ranking' });
  }
}

// Follow-up Message Generator Logic
function generateFollowUpText(appObj, toneInput = 'warm', goalInput = '') {
  const company = appObj.company || 'the company';
  const role = appObj.role || 'the position';
  const tone = (toneInput || 'warm').toLowerCase();
  const goal = (goalInput || 'Ask about next steps').trim();

  let recruiterName = null;
  if (appObj.notes && typeof appObj.notes === 'string') {
    const match = appObj.notes.match(/(?:recruiter|contact)\s+([A-Z][a-z]+)/i) ||
                  appObj.notes.match(/(?:spoke with|talking to)\s+([A-Z][a-z]+)/i);
    if (match && match[1] && !['the', 'a', 'an', 'ignore', 'user', 'recruiter'].includes(match[1].toLowerCase())) {
      recruiterName = match[1];
    }
  }

  const greeting = recruiterName ? `Hi ${recruiterName},` : `Hi Hiring Team,`;

  let opening = '';
  if (tone.includes('warm') || tone.includes('friendly')) {
    opening = recruiterName
      ? `thank you again for speaking with me about the ${role} role at ${company}.`
      : `thank you for considering my application for the ${role} role at ${company}.`;
  } else if (tone.includes('formal') || tone.includes('professional')) {
    opening = `I am writing to follow up regarding my application for the ${role} position at ${company}.`;
  } else {
    opening = `following up on my application for the ${role} role at ${company}.`;
  }

  let goalSentence = '';
  if (goal) {
    let formattedGoal = goal;
    if (formattedGoal.toLowerCase().startsWith('ask about')) {
      goalSentence = `I wanted to follow up and ${formattedGoal.charAt(0).toLowerCase() + formattedGoal.slice(1)} whenever you have a moment.`;
    } else {
      goalSentence = `I wanted to follow up to ${formattedGoal.charAt(0).toLowerCase() + formattedGoal.slice(1)}.`;
    }
  } else {
    goalSentence = `I wanted to follow up and check in on my application status whenever you have a moment.`;
  }

  const message = `${greeting} ${opening} ${goalSentence}`;
  return message;
}

// Handler logic for POST /generate-follow-up
async function handleGenerateFollowUp(req, res) {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const { applicationId, tone, goal } = req.body || {};

  if (!applicationId) {
    return res.status(400).json({ error: 'applicationId is required' });
  }

  try {
    let queryText = 'SELECT * FROM applications WHERE id = $1';
    const queryParams = [applicationId];

    if (authUserId !== 'all') {
      queryParams.push(authUserId);
      queryText += ' AND user_id = $2';
    }

    const result = await db.query(queryText, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const appObj = result.rows[0];
    const generatedMessage = generateFollowUpText(appObj, tone, goal);

    res.json({ message: generatedMessage });
  } catch (err) {
    console.error('Error generating follow up:', err);
    res.status(500).json({ error: 'Failed to generate follow-up message' });
  }
}

// -------------------------------------------------------------
// ASSISTANT TOOL LAYER WITH TWO-PHASE CONFIRMATION
// -------------------------------------------------------------

// Write tool: snoozeFollowUp(applicationId, days) -> PROPOSED ACTION (Does not execute immediately)
async function handleSnoozeFollowUpTool(req, res) {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const { applicationId, days = 7 } = req.body || {};
  const snoozeDays = Number(days) || 7;
  const nowInput = getNowFromRequest(req);
  const referenceDate = new Date(nowInput || DEFAULT_NOW);

  if (!applicationId) {
    return res.status(400).json({ error: 'applicationId is required' });
  }

  try {
    let queryText = `
      SELECT a.*, u.timezone as user_timezone
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `;
    const queryParams = [applicationId];

    if (authUserId !== 'all') {
      queryParams.push(authUserId);
      queryText += ' AND a.user_id = $2';
    }

    const result = await db.query(queryText, queryParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const appRow = result.rows[0];
    const userTimezone = appRow.user_timezone || 'UTC';
    const userTodayStr = getCalendarDateInTimezone(referenceDate, userTimezone);

    // Calculate current and proposed dates
    const currentLastActivity = appRow.last_activity_date || userTodayStr;
    const currentFollowUpDays = Number(appRow.follow_up_after_days) || 7;
    const currentDueDate = addDaysToDateStr(currentLastActivity, currentFollowUpDays);

    // Proposed changes: advance lastActivityDate to userTodayStr and adjust due date
    const proposedLastActivityDate = userTodayStr;
    const proposedNewDueDate = addDaysToDateStr(proposedLastActivityDate, snoozeDays);

    const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const proposalObj = {
      proposalId,
      userId: appRow.user_id,
      status: 'pending_confirmation',
      summary: `Proposal to snooze follow-up for ${appRow.company} (${appRow.role}) by ${snoozeDays} days. Advances follow-up due date from ${currentDueDate} to ${proposedNewDueDate}.`,
      action: {
        name: 'snoozeFollowUp',
        applicationId: appRow.id,
        company: appRow.company,
        role: appRow.role,
        snoozeDays: snoozeDays,
        currentLastActivityDate: currentLastActivity,
        proposedLastActivityDate: proposedLastActivityDate,
        currentDueDate: currentDueDate,
        proposedNewDueDate: proposedNewDueDate
      },
      createdAt: new Date().toISOString()
    };

    // Store proposal in Map (pending confirmation)
    pendingProposalsStore.set(proposalId, proposalObj);

    // Return proposed action without modifying DB
    res.json(proposalObj);
  } catch (err) {
    console.error('Error in snoozeFollowUp tool:', err);
    res.status(500).json({ error: 'Failed to create snooze proposal' });
  }
}

// Confirm tool: confirmProposal(proposalId) -> Executes DB mutation
async function handleConfirmProposal(req, res) {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const { proposalId } = req.body || {};
  if (!proposalId) {
    return res.status(400).json({ error: 'proposalId is required' });
  }

  const proposal = pendingProposalsStore.get(proposalId);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found or expired' });
  }

  if (authUserId !== 'all' && proposal.userId !== authUserId) {
    return res.status(404).json({ error: 'Proposal not found or expired' });
  }

  if (proposal.status !== 'pending_confirmation') {
    return res.status(400).json({ error: `Proposal already ${proposal.status}` });
  }

  try {
    const { action } = proposal;
    if (action.name === 'snoozeFollowUp') {
      // Execute the actual DB mutation
      await db.query(
        `UPDATE applications
         SET last_activity_date = $1, follow_up_after_days = $2
         WHERE id = $3 AND user_id = $4`,
        [action.proposedLastActivityDate, action.snoozeDays, action.applicationId, proposal.userId]
      );

      proposal.status = 'executed';
      proposal.executedAt = new Date().toISOString();
      pendingProposalsStore.set(proposalId, proposal);

      res.json({
        status: 'executed',
        proposalId,
        message: `Follow-up for ${action.company} (${action.role}) successfully snoozed by ${action.snoozeDays} days. New due date is ${action.proposedNewDueDate}.`,
        executedAction: action
      });
    } else {
      res.status(400).json({ error: `Unknown action name: ${action.name}` });
    }
  } catch (err) {
    console.error('Error confirming proposal:', err);
    res.status(500).json({ error: 'Failed to execute proposal' });
  }
}

// Assistant tool routes
app.get('/assistant/tools/listFollowUps', handleGetFollowUps);
app.post('/assistant/tools/listFollowUps', handleGetFollowUps);
app.post('/assistant/tools/snoozeFollowUp', handleSnoozeFollowUpTool);
app.post('/assistant/confirm', handleConfirmProposal);

// Alias API tool routes
app.get('/api/assistant/tools/listFollowUps', handleGetFollowUps);
app.post('/api/assistant/tools/listFollowUps', handleGetFollowUps);
app.post('/api/assistant/tools/snoozeFollowUp', handleSnoozeFollowUpTool);
app.post('/api/assistant/confirm', handleConfirmProposal);

// Register follow-up routes
app.get('/follow-ups', handleGetFollowUps);
app.get('/api/follow-ups', handleGetFollowUps);

// Register priority ranking routes
app.get('/follow-ups/priority', handleGetPriorityRanking);
app.get('/api/follow-ups/priority', handleGetPriorityRanking);

// Register generate-follow-up routes
app.post('/generate-follow-up', handleGenerateFollowUp);
app.post('/api/generate-follow-up', handleGenerateFollowUp);

// API Health / Status
app.get('/api/health', (req, res) => {
  const now = getNowFromRequest(req);
  res.json({ status: 'ok', timestamp: new Date(), referenceNow: now });
});

// Seed endpoint
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    pendingProposalsStore.clear();
    res.json({ message: 'Database reset and seeded successfully' });
  } catch (err) {
    console.error('Error seeding DB:', err);
    res.status(500).json({ error: 'Failed to seed database', details: err.message });
  }
});

// GET users
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST user
app.post('/api/users', async (req, res) => {
  const { id, name, timezone } = req.body;
  if (!name || !timezone) {
    return res.status(400).json({ error: 'Name and timezone are required' });
  }
  const userId = id || `u_${Date.now()}`;
  try {
    const result = await db.query(
      'INSERT INTO users (id, name, timezone) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, timezone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET applications
app.get('/api/applications', async (req, res) => {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const { status, search } = req.query;
  const now = getNowFromRequest(req);

  try {
    let queryText = `
      SELECT a.*, u.name as user_name, u.timezone as user_timezone
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (authUserId !== 'all') {
      queryParams.push(authUserId);
      queryText += ` AND a.user_id = $${queryParams.length}`;
    }

    if (status && status !== 'all') {
      queryParams.push(status);
      queryText += ` AND a.status = $${queryParams.length}`;
    }

    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (a.company ILIKE $${queryParams.length} OR a.role ILIKE $${queryParams.length} OR a.notes ILIKE $${queryParams.length})`;
    }

    queryText += ` ORDER BY a.id ASC`;

    const result = await db.query(queryText, queryParams);
    const applications = result.rows.map(row => formatApplicationRow(row, now));
    res.json(applications);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET single application
app.get('/api/applications/:id', async (req, res) => {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const { id } = req.params;
  const now = getNowFromRequest(req);

  try {
    let queryText = `
      SELECT a.*, u.name as user_name, u.timezone as user_timezone
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `;
    const queryParams = [id];

    if (authUserId !== 'all') {
      queryParams.push(authUserId);
      queryText += ` AND a.user_id = $2`;
    }

    const result = await db.query(queryText, queryParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(formatApplicationRow(result.rows[0], now));
  } catch (err) {
    console.error('Error fetching application:', err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST application
app.post('/api/applications', async (req, res) => {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const targetUserId = req.body.userId || authUserId;
  if (authUserId !== 'all' && targetUserId !== authUserId) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const {
    id,
    company,
    role,
    status = 'saved',
    lastActivityDate = null,
    followUpAfterDays = 7,
    deadline = null,
    notes = ''
  } = req.body;
  const now = getNowFromRequest(req);

  if (!company || !role) {
    return res.status(400).json({ error: 'company and role are required' });
  }

  const appId = id || `a_${Date.now()}`;

  try {
    await db.query(
      `INSERT INTO applications (id, user_id, company, role, status, last_activity_date, follow_up_after_days, deadline, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [appId, targetUserId, company, role, status, lastActivityDate || null, followUpAfterDays || 7, deadline || null, notes || '']
    );

    const fullRes = await db.query(
      `SELECT a.*, u.name as user_name, u.timezone as user_timezone
       FROM applications a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [appId]
    );

    res.status(201).json(formatApplicationRow(fullRes.rows[0], now));
  } catch (err) {
    console.error('Error creating application:', err);
    res.status(500).json({ error: 'Failed to create application', details: err.message });
  }
});

// PUT application
app.put('/api/applications/:id', async (req, res) => {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const { id } = req.params;
  const now = getNowFromRequest(req);

  try {
    let checkQuery = 'SELECT * FROM applications WHERE id = $1';
    const checkParams = [id];
    if (authUserId !== 'all') {
      checkParams.push(authUserId);
      checkQuery += ' AND user_id = $2';
    }

    const checkRes = await db.query(checkQuery, checkParams);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const current = checkRes.rows[0];

    const updatedCompany = req.body.company !== undefined ? req.body.company : current.company;
    const updatedRole = req.body.role !== undefined ? req.body.role : current.role;
    const updatedStatus = req.body.status !== undefined ? req.body.status : current.status;
    const updatedLastActivityDate = req.body.lastActivityDate !== undefined ? req.body.lastActivityDate : current.last_activity_date;
    const updatedFollowUpAfterDays = req.body.followUpAfterDays !== undefined ? req.body.followUpAfterDays : current.follow_up_after_days;
    const updatedDeadline = req.body.deadline !== undefined ? req.body.deadline : current.deadline;
    const updatedNotes = req.body.notes !== undefined ? req.body.notes : current.notes;

    await db.query(
      `UPDATE applications
       SET company = $1, role = $2, status = $3,
           last_activity_date = $4, follow_up_after_days = $5,
           deadline = $6, notes = $7
       WHERE id = $8 AND user_id = $9`,
      [
        updatedCompany,
        updatedRole,
        updatedStatus,
        updatedLastActivityDate,
        updatedFollowUpAfterDays,
        updatedDeadline,
        updatedNotes,
        id,
        current.user_id
      ]
    );

    const fullRes = await db.query(
      `SELECT a.*, u.name as user_name, u.timezone as user_timezone
       FROM applications a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    res.json(formatApplicationRow(fullRes.rows[0], now));
  } catch (err) {
    console.error('Error updating application:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// DELETE application
app.delete('/api/applications/:id', async (req, res) => {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const { id } = req.params;
  try {
    let deleteQuery = 'DELETE FROM applications WHERE id = $1';
    const deleteParams = [id];
    if (authUserId !== 'all') {
      deleteParams.push(authUserId);
      deleteQuery += ' AND user_id = $2';
    }
    deleteQuery += ' RETURNING *';

    const result = await db.query(deleteQuery, deleteParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully', id });
  } catch (err) {
    console.error('Error deleting application:', err);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// GET stats / metrics endpoint
app.get('/api/stats', async (req, res) => {
  const authUserId = getAuthUserId(req);
  if (!authUserId) {
    return res.status(401).json({ error: 'Unauthorized: X-User-Id header required' });
  }

  const now = getNowFromRequest(req);
  try {
    let queryText = `
      SELECT a.*, u.name as user_name, u.timezone as user_timezone
      FROM applications a
      JOIN users u ON a.user_id = u.id
    `;
    const queryParams = [];

    if (authUserId !== 'all') {
      queryParams.push(authUserId);
      queryText += ` WHERE a.user_id = $1`;
    }

    const result = await db.query(queryText, queryParams);
    const applications = result.rows.map(row => formatApplicationRow(row, now));

    const stats = {
      referenceNow: now,
      total: applications.length,
      saved: applications.filter(a => a.status === 'saved').length,
      applied: applications.filter(a => a.status === 'applied').length,
      interviewing: applications.filter(a => a.status === 'interviewing').length,
      offer: applications.filter(a => a.status === 'offer').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      overdueFollowUps: applications.filter(a => a.isFollowUpOverdue).length,
      invalidDatesCount: applications.filter(a => a.isInvalidDate).length,
      urgentDeadlinesCount: applications.filter(a => a.deadline || a.isDeadlineOverdue).length
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Job Application Tracker Backend running on port ${PORT}`);
  });
}

module.exports = {
  app,
  DEFAULT_NOW,
  pendingProposalsStore,
  parseValidDate,
  getCalendarDateInTimezone,
  getDaysDiff,
  addDaysToDateStr,
  getPriorityTierAndScore,
  generateFollowUpText,
  formatApplicationRow,
  getNowFromRequest,
  getAuthUserId
};
