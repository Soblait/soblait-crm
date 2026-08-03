const express = require('express');
const bcrypt = require('bcryptjs');
const { query, logAudit } = require('../db');

const router = express.Router();

/* ---------- Team & Users ---------- */
router.get('/users', async (req, res, next) => {
  try {
    const rows = (await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC')).rows;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
    const hash = bcrypt.hashSync(password || 'changeme123', 10);
    const result = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id',
      [name, email, hash, role || 'Sales Rep']
    );
    const user = (await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit('create', 'user', user.id, `Added team member ${user.name}`);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM users WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'User not found' });
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'user', req.params.id, `Removed team member ${existing.name}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Audit Log ---------- */
router.get('/audit-log', async (req, res, next) => {
  try {
    const rows = (await query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200')).rows;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/* ---------- Pipeline Stages ---------- */
router.get('/stages', async (req, res, next) => {
  try {
    const rows = (await query('SELECT * FROM pipeline_stages ORDER BY position ASC')).rows;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/stages', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const maxPos = (await query('SELECT MAX(position) as m FROM pipeline_stages')).rows[0].m;
    const result = await query(
      'INSERT INTO pipeline_stages (name, position) VALUES ($1,$2) RETURNING id',
      [name, (maxPos === null ? -1 : maxPos) + 1]
    );
    await logAudit('create', 'pipeline_stage', result.rows[0].id, `Added pipeline stage ${name}`);
    res.status(201).json((await query('SELECT * FROM pipeline_stages WHERE id = $1', [result.rows[0].id])).rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/stages/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM pipeline_stages WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Stage not found' });
    const { name, position } = req.body;
    await query('UPDATE pipeline_stages SET name=$1, position=$2 WHERE id=$3', [
      name ?? existing.name,
      position === undefined ? existing.position : position,
      req.params.id,
    ]);
    await logAudit('update', 'pipeline_stage', req.params.id, `Updated pipeline stage ${name ?? existing.name}`);
    res.json((await query('SELECT * FROM pipeline_stages WHERE id = $1', [req.params.id])).rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/stages/reorder', async (req, res, next) => {
  try {
    const { order } = req.body; // array of ids in new order
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });
    for (let idx = 0; idx < order.length; idx++) {
      await query('UPDATE pipeline_stages SET position = $1 WHERE id = $2', [idx, order[idx]]);
    }
    await logAudit('update', 'pipeline_stage', null, 'Reordered pipeline stages');
    res.json((await query('SELECT * FROM pipeline_stages ORDER BY position ASC')).rows);
  } catch (err) {
    next(err);
  }
});

router.delete('/stages/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM pipeline_stages WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Stage not found' });
    await query('DELETE FROM pipeline_stages WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'pipeline_stage', req.params.id, `Deleted pipeline stage ${existing.name}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Tags ---------- */
router.get('/tags', async (req, res, next) => {
  try {
    res.json((await query('SELECT * FROM tags ORDER BY id ASC')).rows);
  } catch (err) {
    next(err);
  }
});

router.post('/tags', async (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await query('INSERT INTO tags (name, color) VALUES ($1,$2) RETURNING id', [name, color || '#8b5cf6']);
    await logAudit('create', 'tag', result.rows[0].id, `Created tag ${name}`);
    res.status(201).json((await query('SELECT * FROM tags WHERE id = $1', [result.rows[0].id])).rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/tags/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM tags WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Tag not found' });
    const { name, color } = req.body;
    await query('UPDATE tags SET name=$1, color=$2 WHERE id=$3', [name ?? existing.name, color ?? existing.color, req.params.id]);
    await logAudit('update', 'tag', req.params.id, `Updated tag ${name ?? existing.name}`);
    res.json((await query('SELECT * FROM tags WHERE id = $1', [req.params.id])).rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/tags/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM tags WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Tag not found' });
    await query('DELETE FROM tags WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'tag', req.params.id, `Deleted tag ${existing.name}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Onboarding Templates ---------- */
router.get('/onboarding-templates', async (req, res, next) => {
  try {
    res.json((await query('SELECT * FROM onboarding_templates ORDER BY created_at DESC')).rows);
  } catch (err) {
    next(err);
  }
});

router.post('/onboarding-templates', async (req, res, next) => {
  try {
    const { name, body } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await query('INSERT INTO onboarding_templates (name, body) VALUES ($1,$2) RETURNING id', [name, body || '']);
    await logAudit('create', 'onboarding_template', result.rows[0].id, `Created onboarding template ${name}`);
    res.status(201).json((await query('SELECT * FROM onboarding_templates WHERE id = $1', [result.rows[0].id])).rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/onboarding-templates/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM onboarding_templates WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    const { name, body } = req.body;
    await query('UPDATE onboarding_templates SET name=$1, body=$2 WHERE id=$3', [name ?? existing.name, body ?? existing.body, req.params.id]);
    await logAudit('update', 'onboarding_template', req.params.id, `Updated onboarding template ${name ?? existing.name}`);
    res.json((await query('SELECT * FROM onboarding_templates WHERE id = $1', [req.params.id])).rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/onboarding-templates/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM onboarding_templates WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    await query('DELETE FROM onboarding_templates WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'onboarding_template', req.params.id, `Deleted onboarding template ${existing.name}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Email Templates ---------- */
router.get('/email-templates', async (req, res, next) => {
  try {
    res.json((await query('SELECT * FROM email_templates ORDER BY created_at DESC')).rows);
  } catch (err) {
    next(err);
  }
});

router.post('/email-templates', async (req, res, next) => {
  try {
    const { name, subject, body } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await query('INSERT INTO email_templates (name, subject, body) VALUES ($1,$2,$3) RETURNING id', [name, subject || '', body || '']);
    await logAudit('create', 'email_template', result.rows[0].id, `Created email template ${name}`);
    res.status(201).json((await query('SELECT * FROM email_templates WHERE id = $1', [result.rows[0].id])).rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/email-templates/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM email_templates WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    const { name, subject, body } = req.body;
    await query('UPDATE email_templates SET name=$1, subject=$2, body=$3 WHERE id=$4', [
      name ?? existing.name, subject ?? existing.subject, body ?? existing.body, req.params.id,
    ]);
    await logAudit('update', 'email_template', req.params.id, `Updated email template ${name ?? existing.name}`);
    res.json((await query('SELECT * FROM email_templates WHERE id = $1', [req.params.id])).rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/email-templates/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM email_templates WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    await query('DELETE FROM email_templates WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'email_template', req.params.id, `Deleted email template ${existing.name}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Integrations ---------- */
router.get('/integrations', async (req, res, next) => {
  try {
    res.json((await query('SELECT * FROM integrations ORDER BY id ASC')).rows);
  } catch (err) {
    next(err);
  }
});

router.put('/integrations/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM integrations WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Integration not found' });
    const { connected } = req.body;
    await query('UPDATE integrations SET connected=$1 WHERE id=$2', [connected ? 1 : 0, req.params.id]);
    await logAudit('update', 'integration', req.params.id, `${connected ? 'Connected' : 'Disconnected'} ${existing.name}`);
    res.json((await query('SELECT * FROM integrations WHERE id = $1', [req.params.id])).rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
