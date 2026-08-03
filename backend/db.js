const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const isLocalHost = (url) => {
  if (!url) return false;
  return /(localhost|127\.0\.0\.1)/i.test(url);
};

const pool = new Pool({
  connectionString,
  ssl: connectionString && !isLocalHost(connectionString) ? { rejectUnauthorized: false } : false,
});

function query(text, params) {
  return pool.query(text, params);
}

async function migrate() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'Sales Rep',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'new',
      source TEXT DEFAULT 'website',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS opportunities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      value REAL DEFAULT 0,
      stage TEXT DEFAULT 'New',
      close_date TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      related_to TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS pipeline_stages (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      position INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#8b5cf6'
    )`,
    `CREATE TABLE IF NOT EXISTS onboarding_templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      body TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS email_templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS integrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      connected INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS automations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      trigger_desc TEXT,
      active INTEGER DEFAULT 1,
      run_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS automation_log (
      id SERIAL PRIMARY KEY,
      automation_id INTEGER,
      automation_name TEXT,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS calendar_events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT DEFAULT 'event',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  ];

  for (const stmt of statements) {
    await query(stmt);
  }
}

async function logAudit(action, entity, entity_id, details) {
  await query(
    'INSERT INTO audit_log (action, entity, entity_id, details) VALUES ($1,$2,$3,$4)',
    [action, entity, entity_id || null, details || '']
  );
}

async function logAutomation(automation_id, automation_name, message) {
  await query(
    'INSERT INTO automation_log (automation_id, automation_name, message) VALUES ($1,$2,$3)',
    [automation_id, automation_name, message]
  );
  await query('UPDATE automations SET run_count = run_count + 1 WHERE id = $1', [automation_id]);
}

// Fires any active automation rules relevant to a newly created opportunity.
async function checkOpportunityAutomations(opp) {
  const rules = (await query('SELECT * FROM automations WHERE active = 1')).rows;
  for (const rule of rules) {
    if (rule.name === 'Big Deal Alert' && opp.value >= 1000000) {
      await logAutomation(rule.id, rule.name, `${rule.name} fired: "${opp.name}" (${opp.company}) is worth $${opp.value.toLocaleString()}`);
    }
    if (rule.name === 'Deal Won' && opp.stage === 'Closed Won') {
      await logAutomation(rule.id, rule.name, `${rule.name} fired: "${opp.name}" (${opp.company}) marked as Closed Won`);
    }
  }
}

async function checkLeadAutomations(lead) {
  const rules = (await query('SELECT * FROM automations WHERE active = 1')).rows;
  for (const rule of rules) {
    if (rule.name === 'Welcome Email') {
      await logAutomation(rule.id, rule.name, `${rule.name} fired: welcome email queued for ${lead.name} <${lead.email || 'n/a'}>`);
    }
  }
}

async function seed() {
  const userCount = Number((await query('SELECT COUNT(*) as c FROM users')).rows[0].c);
  if (userCount === 0) {
    const hash = bcrypt.hashSync('demo1234', 10);
    await query('INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)',
      ['Ophir Shalev', 'Ophir.shalev@soblait.com', hash, 'Admin']);
    await query('INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)',
      ['Maya Chen', 'maya.chen@soblait.com', bcrypt.hashSync('demo1234', 10), 'Sales Rep']);
    await query('INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)',
      ['Jordan Lee', 'jordan.lee@soblait.com', bcrypt.hashSync('demo1234', 10), 'Manager']);
  }

  const leadCount = Number((await query('SELECT COUNT(*) as c FROM leads')).rows[0].c);
  if (leadCount === 0) {
    const leads = [
      ['Sarah Johnson', 'Acme Retail', 'sarah.johnson@acmeretail.com', '555-0101', 'contacted', 'referral'],
      ['David Kim', 'DesignCo', 'david.kim@designco.com', '555-0102', 'new', 'website'],
      ['Priya Patel', 'BuildRight Inc', 'priya.patel@buildright.com', '555-0103', 'qualified', 'event'],
    ];
    for (const l of leads) {
      await query('INSERT INTO leads (name, company, email, phone, status, source) VALUES ($1,$2,$3,$4,$5,$6)', l);
    }
  }

  const oppCount = Number((await query('SELECT COUNT(*) as c FROM opportunities')).rows[0].c);
  if (oppCount === 0) {
    await query('INSERT INTO opportunities (name, company, value, stage, close_date) VALUES ($1,$2,$3,$4,$5)',
      ['TechCorp Enterprise Deal', 'TechCorp', 45000, 'Proposal', '2026-08-15']);
    await query('INSERT INTO opportunities (name, company, value, stage, close_date) VALUES ($1,$2,$3,$4,$5)',
      ['StartupLab Pilot', 'StartupLab', 12000, 'Discovery', '2026-09-01']);
  }

  const taskCount = Number((await query('SELECT COUNT(*) as c FROM tasks')).rows[0].c);
  if (taskCount === 0) {
    const tasks = [
      ['Follow up with Sarah Johnson', 'todo', 'high', '2026-08-05'],
      ['Schedule demo with DesignCo', 'todo', 'medium', '2026-08-08'],
      ['Prepare TechCorp proposal deck', 'in_progress', 'high', '2026-08-10'],
    ];
    for (const t of tasks) {
      await query('INSERT INTO tasks (title, status, priority, due_date) VALUES ($1,$2,$3,$4)', t);
    }
  }

  const stageCount = Number((await query('SELECT COUNT(*) as c FROM pipeline_stages')).rows[0].c);
  if (stageCount === 0) {
    const stages = ['New', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    for (let i = 0; i < stages.length; i++) {
      await query('INSERT INTO pipeline_stages (name, position) VALUES ($1,$2)', [stages[i], i]);
    }
  }

  const tagCount = Number((await query('SELECT COUNT(*) as c FROM tags')).rows[0].c);
  if (tagCount === 0) {
    await query('INSERT INTO tags (name, color) VALUES ($1,$2)', ['Hot Lead', '#ec4899']);
    await query('INSERT INTO tags (name, color) VALUES ($1,$2)', ['Enterprise', '#8b5cf6']);
    await query('INSERT INTO tags (name, color) VALUES ($1,$2)', ['Renewal', '#22c55e']);
  }

  const emailTplCount = Number((await query('SELECT COUNT(*) as c FROM email_templates')).rows[0].c);
  if (emailTplCount === 0) {
    await query('INSERT INTO email_templates (name, subject, body) VALUES ($1,$2,$3)', [
      'Welcome Email',
      'Welcome to Soblait!',
      'Hi {{name}},\n\nThanks for your interest in Soblait. We would love to learn more about your goals — reply anytime.\n\nBest,\nThe Soblait Team',
    ]);
    await query('INSERT INTO email_templates (name, subject, body) VALUES ($1,$2,$3)', [
      'Follow Up',
      'Following up on our conversation',
      'Hi {{name}},\n\nJust checking in on next steps. Let me know if you have any questions!\n\nBest,\nThe Soblait Team',
    ]);
  }

  const onbCount = Number((await query('SELECT COUNT(*) as c FROM onboarding_templates')).rows[0].c);
  if (onbCount === 0) {
    await query('INSERT INTO onboarding_templates (name, body) VALUES ($1,$2)', [
      'Standard Onboarding',
      'Step 1: Kickoff call\nStep 2: Account setup\nStep 3: Training session\nStep 4: Go live',
    ]);
    await query('INSERT INTO onboarding_templates (name, body) VALUES ($1,$2)', [
      'Enterprise Onboarding',
      'Step 1: Executive kickoff\nStep 2: Technical integration\nStep 3: Security review\nStep 4: Phased rollout\nStep 5: Success review',
    ]);
  }

  const integrationCount = Number((await query('SELECT COUNT(*) as c FROM integrations')).rows[0].c);
  if (integrationCount === 0) {
    const integrations = [
      ['Slack', 'Send notifications to your Slack channels'],
      ['HubSpot', 'Sync contacts and companies with HubSpot'],
      ['Google Calendar', 'Sync tasks and close dates to Google Calendar'],
      ['Zapier', 'Connect Soblait to thousands of apps'],
    ];
    for (const i of integrations) {
      await query('INSERT INTO integrations (name, description, connected) VALUES ($1,$2,0)', i);
    }
  }

  const automationCount = Number((await query('SELECT COUNT(*) as c FROM automations')).rows[0].c);
  if (automationCount === 0) {
    await query('INSERT INTO automations (name, trigger_desc, active, run_count) VALUES ($1,$2,1,3)',
      ['Welcome Email', 'When a new lead is created, send a welcome email']);
    await query('INSERT INTO automations (name, trigger_desc, active, run_count) VALUES ($1,$2,1,1)',
      ['Big Deal Alert', 'When an opportunity value exceeds $1,000,000, alert the team']);
    await query('INSERT INTO automations (name, trigger_desc, active, run_count) VALUES ($1,$2,1,2)',
      ['Deal Won', 'When an opportunity moves to Closed Won, notify the team and log revenue']);
  }

  const logCount = Number((await query('SELECT COUNT(*) as c FROM automation_log')).rows[0].c);
  if (logCount === 0) {
    const auto = (await query('SELECT * FROM automations')).rows;
    for (const a of auto) {
      await query('INSERT INTO automation_log (automation_id, automation_name, message) VALUES ($1,$2,$3)',
        [a.id, a.name, `${a.name} initialized and ready`]);
    }
  }

  const auditCount = Number((await query('SELECT COUNT(*) as c FROM audit_log')).rows[0].c);
  if (auditCount === 0) {
    const entries = [
      ['create', 'lead', 1, 'Created lead Sarah Johnson'],
      ['create', 'lead', 2, 'Created lead David Kim'],
      ['create', 'opportunity', 1, 'Created opportunity TechCorp Enterprise Deal'],
      ['create', 'opportunity', 2, 'Created opportunity StartupLab Pilot'],
      ['create', 'task', 1, 'Created task Follow up with Sarah Johnson'],
      ['update', 'lead', 1, 'Updated status of Sarah Johnson to contacted'],
    ];
    for (const e of entries) {
      await query('INSERT INTO audit_log (action, entity, entity_id, details) VALUES ($1,$2,$3,$4)', e);
    }
  }

  const eventCount = Number((await query('SELECT COUNT(*) as c FROM calendar_events')).rows[0].c);
  if (eventCount === 0) {
    await query('INSERT INTO calendar_events (title, date, type) VALUES ($1,$2,$3)',
      ['Kickoff call with TechCorp', '2026-08-06', 'event']);
    await query('INSERT INTO calendar_events (title, date, type) VALUES ($1,$2,$3)',
      ['Quarterly business review', '2026-08-20', 'event']);
  }
}

async function initDb() {
  await migrate();
  await seed();
}

module.exports = { pool, query, initDb, logAudit, logAutomation, checkOpportunityAutomations, checkLeadAutomations };
