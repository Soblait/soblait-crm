const express = require('express');
const { query, logAudit, logAutomation } = require('../db');

const router = express.Router();

const TEMPLATES = {
  'Welcome Email': 'When a new lead is created, send a welcome email',
  'Big Deal Alert': 'When an opportunity value exceeds $1,000,000, alert the team',
  'Deal Won': 'When an opportunity moves to Closed Won, notify the team and log revenue',
};

router.get('/', async (req, res, next) => {
  try {
    const rules = (await query('SELECT * FROM automations ORDER BY created_at DESC')).rows;
    const total = rules.length;
    const active = rules.filter((r) => r.active).length;
    const disabled = total - active;
    const totalRuns = rules.reduce((s, r) => s + r.run_count, 0);
    const successRate = total === 0 ? 0 : Math.round((active / total) * 100);
    res.json({ rules, stats: { total, active, disabled, successRate, totalRuns } });
  } catch (err) {
    next(err);
  }
});

router.get('/log', async (req, res, next) => {
  try {
    const rows = (await query('SELECT * FROM automation_log ORDER BY created_at DESC LIMIT 100')).rows;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, trigger_desc, active } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await query(
      'INSERT INTO automations (name, trigger_desc, active) VALUES ($1,$2,$3) RETURNING id',
      [name, trigger_desc || TEMPLATES[name] || '', active === undefined ? 1 : (active ? 1 : 0)]
    );
    const rule = (await query('SELECT * FROM automations WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit('create', 'automation', rule.id, `Created automation rule ${rule.name}`);
    await logAutomation(rule.id, rule.name, `${rule.name} rule created and activated`);
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
});

router.post('/template/:name', async (req, res, next) => {
  try {
    const name = req.params.name;
    if (!TEMPLATES[name]) return res.status(400).json({ error: 'Unknown template' });
    const result = await query(
      'INSERT INTO automations (name, trigger_desc, active) VALUES ($1,$2,1) RETURNING id',
      [name, TEMPLATES[name]]
    );
    const rule = (await query('SELECT * FROM automations WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit('create', 'automation', rule.id, `Created automation rule ${rule.name} from template`);
    await logAutomation(rule.id, rule.name, `${rule.name} rule created from Quick Template`);
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM automations WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Rule not found' });
    const { name, trigger_desc, active } = req.body;
    await query('UPDATE automations SET name=$1, trigger_desc=$2, active=$3 WHERE id=$4', [
      name ?? existing.name,
      trigger_desc ?? existing.trigger_desc,
      active === undefined ? existing.active : (active ? 1 : 0),
      req.params.id,
    ]);
    const updated = (await query('SELECT * FROM automations WHERE id = $1', [req.params.id])).rows[0];
    await logAudit('update', 'automation', updated.id, `Updated automation rule ${updated.name}`);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM automations WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Rule not found' });
    await query('DELETE FROM automations WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'automation', req.params.id, `Deleted automation rule ${existing.name}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
