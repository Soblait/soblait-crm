const express = require('express');
const { query, logAudit, checkProjectAutomations } = require('../db');

const router = express.Router();

const STAGES = ['idea', 'active', 'won', 'lost'];

router.get('/', async (req, res, next) => {
  try {
    const rows = (await query('SELECT * FROM projects ORDER BY created_at DESC')).rows;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = (await query('SELECT * FROM projects WHERE id = $1', [req.params.id])).rows[0];
    if (!row) return res.status(404).json({ error: 'Project not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, company, value, stage, close_date, notes, type, demo_done, demo_date, lead_id } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const finalStage = STAGES.includes(stage) ? stage : 'idea';
    const result = await query(
      `INSERT INTO projects (name, company, value, stage, close_date, notes, type, demo_done, demo_date, lead_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        name,
        company || '',
        Number(value) || 0,
        finalStage,
        close_date || null,
        notes || '',
        type || '',
        demo_done ? 1 : 0,
        demo_date || null,
        lead_id || null,
      ]
    );
    const project = (await query('SELECT * FROM projects WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit('create', 'project', project.id, `Created project ${project.name}`);
    await checkProjectAutomations(project);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM projects WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Project not found' });
    const { name, company, value, stage, close_date, notes, type, demo_done, demo_date, lead_id } = req.body;
    const finalStage = stage === undefined ? existing.stage : (STAGES.includes(stage) ? stage : existing.stage);
    await query(
      `UPDATE projects SET name=$1, company=$2, value=$3, stage=$4, close_date=$5, notes=$6, type=$7, demo_done=$8, demo_date=$9, lead_id=$10, updated_at=NOW() WHERE id=$11`,
      [
        name ?? existing.name,
        company ?? existing.company,
        value !== undefined ? Number(value) : existing.value,
        finalStage,
        close_date !== undefined ? close_date : existing.close_date,
        notes ?? existing.notes,
        type ?? existing.type,
        demo_done !== undefined ? (demo_done ? 1 : 0) : existing.demo_done,
        demo_date !== undefined ? demo_date : existing.demo_date,
        lead_id !== undefined ? lead_id : existing.lead_id,
        req.params.id,
      ]
    );
    const updated = (await query('SELECT * FROM projects WHERE id = $1', [req.params.id])).rows[0];
    await logAudit('update', 'project', updated.id, `Updated project ${updated.name}`);
    await checkProjectAutomations(updated);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM projects WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Project not found' });
    await query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'project', req.params.id, `Deleted project ${existing.name}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
