const express = require('express');
const { query, logAudit, checkOpportunityAutomations } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = (await query('SELECT * FROM opportunities ORDER BY created_at DESC')).rows;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = (await query('SELECT * FROM opportunities WHERE id = $1', [req.params.id])).rows[0];
    if (!row) return res.status(404).json({ error: 'Opportunity not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, company, value, stage, close_date, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await query(
      'INSERT INTO opportunities (name, company, value, stage, close_date, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [name, company || '', Number(value) || 0, stage || 'New', close_date || null, notes || '']
    );
    const opp = (await query('SELECT * FROM opportunities WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit('create', 'opportunity', opp.id, `Created opportunity ${opp.name}`);
    await checkOpportunityAutomations(opp);
    res.status(201).json(opp);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM opportunities WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Opportunity not found' });
    const { name, company, value, stage, close_date, notes } = req.body;
    await query(
      `UPDATE opportunities SET name=$1, company=$2, value=$3, stage=$4, close_date=$5, notes=$6, updated_at=NOW() WHERE id=$7`,
      [
        name ?? existing.name,
        company ?? existing.company,
        value !== undefined ? Number(value) : existing.value,
        stage ?? existing.stage,
        close_date ?? existing.close_date,
        notes ?? existing.notes,
        req.params.id,
      ]
    );
    const updated = (await query('SELECT * FROM opportunities WHERE id = $1', [req.params.id])).rows[0];
    await logAudit('update', 'opportunity', updated.id, `Updated opportunity ${updated.name}`);
    await checkOpportunityAutomations(updated);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM opportunities WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Opportunity not found' });
    await query('DELETE FROM opportunities WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'opportunity', req.params.id, `Deleted opportunity ${existing.name}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
