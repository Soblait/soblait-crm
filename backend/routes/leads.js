const express = require('express');
const { query, logAudit, checkLeadAutomations } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = (await query('SELECT * FROM leads ORDER BY created_at DESC')).rows;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = (await query('SELECT * FROM leads WHERE id = $1', [req.params.id])).rows[0];
    if (!row) return res.status(404).json({ error: 'Lead not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, company, email, phone, status, source, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await query(
      'INSERT INTO leads (name, company, email, phone, status, source, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [name, company || '', email || '', phone || '', status || 'new', source || 'website', notes || '']
    );
    const lead = (await query('SELECT * FROM leads WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit('create', 'lead', lead.id, `Created lead ${lead.name}`);
    await checkLeadAutomations(lead);
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM leads WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Lead not found' });
    const { name, company, email, phone, status, source, notes } = req.body;
    await query(
      `UPDATE leads SET name=$1, company=$2, email=$3, phone=$4, status=$5, source=$6, notes=$7, updated_at=NOW() WHERE id=$8`,
      [
        name ?? existing.name,
        company ?? existing.company,
        email ?? existing.email,
        phone ?? existing.phone,
        status ?? existing.status,
        source ?? existing.source,
        notes ?? existing.notes,
        req.params.id,
      ]
    );
    const updated = (await query('SELECT * FROM leads WHERE id = $1', [req.params.id])).rows[0];
    await logAudit('update', 'lead', updated.id, `Updated lead ${updated.name}`);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM leads WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Lead not found' });
    await query('DELETE FROM leads WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'lead', req.params.id, `Deleted lead ${existing.name}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Converts a lead into a new Project (stage 'idea' or 'active'), pre-filled from the lead's
// name/company and linked back via lead_id. Accepts optional value/type/notes so the whole
// conversion can happen in a single step instead of a follow-up edit on the Projects page.
router.post('/:id/convert', async (req, res, next) => {
  try {
    const lead = (await query('SELECT * FROM leads WHERE id = $1', [req.params.id])).rows[0];
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const { stage, value, type, notes } = req.body;
    const finalStage = ['idea', 'active'].includes(stage) ? stage : 'idea';
    const result = await query(
      `INSERT INTO projects (name, company, value, stage, notes, type, lead_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [lead.name, lead.company || '', Number(value) || 0, finalStage, notes || '', type || '', lead.id]
    );
    const project = (await query('SELECT * FROM projects WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit(
      'create',
      'project',
      project.id,
      `Converted lead ${lead.name} into ${finalStage === 'active' ? 'a project' : 'an idea'} (from lead #${lead.id})`
    );
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
