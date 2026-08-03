const express = require('express');
const { query, logAudit } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const events = (await query('SELECT * FROM calendar_events ORDER BY date ASC')).rows;
    const tasks = (await query(`SELECT id, title, due_date as date, priority FROM tasks WHERE due_date IS NOT NULL`)).rows
      .map((t) => ({ ...t, type: 'task' }));
    const closes = (await query(`SELECT id, name as title, close_date as date, stage FROM opportunities WHERE close_date IS NOT NULL`)).rows
      .map((o) => ({ ...o, type: 'opportunity_close' }));

    res.json({
      events: events.map((e) => ({ ...e, type: e.type || 'event' })),
      tasks,
      closes,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, date, type } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'title and date are required' });
    const result = await query(
      'INSERT INTO calendar_events (title, date, type) VALUES ($1,$2,$3) RETURNING id',
      [title, date, type || 'event']
    );
    const event = (await query('SELECT * FROM calendar_events WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit('create', 'calendar_event', event.id, `Created calendar event ${event.title}`);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM calendar_events WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Event not found' });
    await query('DELETE FROM calendar_events WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'calendar_event', req.params.id, `Deleted calendar event ${existing.title}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
