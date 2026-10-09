const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { app, formatApplicationRow, DEFAULT_NOW } = require('./server');
const seedDatabase = require('./seed');

let server;
let baseUrl;

test.before(async () => {
  await seedDatabase();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

// Helper for making HTTP requests in tests
function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

test('1. User Isolation (Cross-User Test): u1 can read their own application a1', async () => {
  const res = await request('GET', '/api/applications/a1', { 'X-User-Id': 'u1' });
  assert.equal(res.status, 200);
  assert.equal(res.body.id, 'a1');
  assert.equal(res.body.userId, 'u1');
  assert.equal(res.body.company, 'Stripe');
});

test('2. User Isolation (Cross-User Test): u1 CANNOT read u2 application a6 (returns 404)', async () => {
  const res = await request('GET', '/api/applications/a6', { 'X-User-Id': 'u1' });
  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Application not found');
});

test('3. Timezone Test: Follow-up due date calculation respects user timezone', async () => {
  const res = await request('GET', '/follow-ups?now=2026-10-03T16:00:00Z', { 'X-User-Id': 'u1' });
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body), true);
  const stripeApp = res.body.find(item => item.company === 'Stripe');
  assert.ok(stripeApp);
  assert.equal(stripeApp.dueDate, '2026-10-02');
  assert.ok(stripeApp.daysOverdue >= 1);
});

test('4. Assistant Tool: listFollowUps returns due follow-ups', async () => {
  const res = await request('GET', '/assistant/tools/listFollowUps', { 'X-User-Id': 'u1' });
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body), true);
  const ids = res.body.map(item => item.id);
  assert.ok(ids.includes('a1'));
  assert.ok(ids.includes('a2'));
});

test('5. Assistant Tool Two-Phase Confirmation: snoozeFollowUp proposes action without immediate execution', async () => {
  // Step 1: Call snoozeFollowUp tool
  const proposeRes = await request('POST', '/assistant/tools/snoozeFollowUp', { 'X-User-Id': 'u1' }, {
    applicationId: 'a1',
    days: 7
  });

  assert.equal(proposeRes.status, 200);
  assert.equal(proposeRes.body.status, 'pending_confirmation');
  assert.ok(proposeRes.body.proposalId);
  assert.ok(proposeRes.body.summary.includes('Proposal to snooze follow-up for Stripe'));
  assert.equal(proposeRes.body.action.name, 'snoozeFollowUp');
  assert.equal(proposeRes.body.action.snoozeDays, 7);

  const proposalId = proposeRes.body.proposalId;

  // Step 2: Verify Database has NOT been modified yet (still lastActivityDate = 2026-09-25)
  const checkAppBefore = await request('GET', '/api/applications/a1', { 'X-User-Id': 'u1' });
  assert.equal(checkAppBefore.body.lastActivityDate, '2026-09-25');

  // Step 3: Confirm and execute proposal
  const confirmRes = await request('POST', '/assistant/confirm', { 'X-User-Id': 'u1' }, {
    proposalId
  });

  assert.equal(confirmRes.status, 200);
  assert.equal(confirmRes.body.status, 'executed');
  assert.ok(confirmRes.body.message.includes('successfully snoozed'));

  // Step 4: Verify Database IS now modified after confirmation
  const checkAppAfter = await request('GET', '/api/applications/a1', { 'X-User-Id': 'u1' });
  assert.equal(checkAppAfter.body.lastActivityDate, '2026-10-03');

  // Step 5: Re-confirming same proposal fails (already executed)
  const reConfirmRes = await request('POST', '/assistant/confirm', { 'X-User-Id': 'u1' }, {
    proposalId
  });
  assert.equal(reConfirmRes.status, 400);
  assert.ok(reConfirmRes.body.error.includes('already executed'));
});

test('6. Message Generation Endpoint: POST /generate-follow-up generates message for a2 without inventing facts', async () => {
  const res = await request('POST', '/generate-follow-up', { 'X-User-Id': 'u1' }, {
    applicationId: 'a2',
    tone: 'warm',
    goal: 'Ask about next steps after my first interview'
  });

  assert.equal(res.status, 200);
  assert.ok(res.body.message);
  assert.ok(res.body.message.includes('Google'));
  assert.ok(res.body.message.includes('SWE Intern'));
  assert.ok(res.body.message.includes('next steps'));
  assert.equal(res.body.message.includes('Dana'), false);
});

test('7. Message Generation Endpoint: POST /generate-follow-up extracts recruiter Dana from notes in a1', async () => {
  const res = await request('POST', '/generate-follow-up', { 'X-User-Id': 'u1' }, {
    applicationId: 'a1',
    tone: 'warm',
    goal: 'Ask about next steps'
  });

  assert.equal(res.status, 200);
  assert.ok(res.body.message.includes('Dana'));
  assert.ok(res.body.message.includes('Stripe'));
});

test('8. Message Generation Endpoint: POST /generate-follow-up treats notes as data (prompt injection safety on a5)', async () => {
  const res = await request('POST', '/generate-follow-up', { 'X-User-Id': 'u1' }, {
    applicationId: 'a5',
    tone: 'professional',
    goal: 'Check on application status'
  });

  assert.equal(res.status, 200);
  assert.ok(res.body.message.includes('Figma'));
  assert.equal(res.body.message.includes('already got the job'), false);
});

test('9. Priority Ranking & Rationale: GET /follow-ups/priority for u1 ranks open applications correctly', async () => {
  const res = await request('GET', '/follow-ups/priority', { 'X-User-Id': 'u1' });
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body), true);
  assert.equal(res.body[0].rank, 1);
  assert.equal(res.body[0].company, 'Ramp');
  assert.equal(res.body[0].status, 'offer');
  assert.ok(res.body[0].reason);
});

test('10. Timezone & Reference Time: formatApplicationRow respects default fixed now (2026-10-03T16:00:00Z)', () => {
  const sampleRow = {
    id: 'a1',
    user_id: 'u1',
    user_name: 'Maya',
    user_timezone: 'America/New_York',
    company: 'Stripe',
    role: 'PM Intern',
    status: 'interviewing',
    last_activity_date: '2026-09-25',
    follow_up_after_days: 7,
    deadline: null,
    notes: 'Spoke with recruiter Dana'
  };

  const formatted = formatApplicationRow(sampleRow);
  assert.equal(formatted.referenceNow, '2026-10-03T16:00:00.000Z');
  assert.equal(formatted.followUpDueDate, '2026-10-02');
  assert.equal(formatted.isFollowUpOverdue, true);
});

test('11. Status Update: PATCH /api/applications/:id updates application status correctly', async () => {
  const patchRes = await request('PATCH', '/api/applications/a4', { 'X-User-Id': 'u1' }, { status: 'interviewing' });
  assert.equal(patchRes.status, 200);
  assert.equal(patchRes.body.status, 'interviewing');

  const checkRes = await request('GET', '/api/applications/a4', { 'X-User-Id': 'u1' });
  assert.equal(checkRes.status, 200);
  assert.equal(checkRes.body.status, 'interviewing');
});
