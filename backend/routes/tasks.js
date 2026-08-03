const express = require('express');
const { query, logAudit } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = (await query('SELECT * FROM tasks ORDER BY created_at DESC')).rows;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, status, priority, due_date, related_to } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const result = await query(
      'INSERT INTO tasks (title, status, priority, due_date, related_to) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [title, status || 'todo', priority || 'medium', due_date || null, related_to || '']
    );
    const task = (await query('SELECT * FROM tasks WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit('create', 'task', task.id, `Created task ${task.title}`);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM tasks WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    const { title, status, priority, due_date, related_to } = req.body;
    await query(
      `UPDATE tasks SET title=$1, status=$2, priority=$3, due_date=$4, related_to=$5, updated_at=NOW() WHERE id=$6`,
      [
        title ?? existing.title,
        status ?? existing.status,
        priority ?? existing.priority,
        due_date ?? existing.due_date,
        related_to ?? existing.related_to,
        req.params.id,
      ]
    );
    const updated = (await query('SELECT * FROM tasks WHERE id = $1', [req.params.id])).rows[0];
    await logAudit('update', 'task', updated.id, `Updated task ${updated.title}`);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM tasks WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'task', req.params.id, `Deleted task ${existing.title}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
