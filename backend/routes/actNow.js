const express = require('express');
const { query, logAudit } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const items = [];

    const tasks = (await query(`SELECT * FROM tasks WHERE status != 'done'`)).rows;
    tasks.forEach((t) => {
      if (t.due_date && new Date(t.due_date) < now) {
        items.push({
          id: `task-overdue-${t.id}`,
          type: 'task_overdue',
          title: `Overdue task: ${t.title}`,
          detail: `Was due ${t.due_date}`,
          entity: 'task',
          entity_id: t.id,
          priority: 'high',
        });
      }
    });

    const opps = (await query(`SELECT * FROM opportunities WHERE stage NOT IN ('Closed Won','Closed Lost')`)).rows;
    opps.forEach((o) => {
      if (!o.close_date) return;
      const days = (new Date(o.close_date) - now) / (1000 * 60 * 60 * 24);
      if (days >= 0 && days <= 7) {
        items.push({
          id: `opp-closing-${o.id}`,
          type: 'opportunity_closing_soon',
          title: `Deal closing soon: ${o.name}`,
          detail: `${o.company} — $${o.value.toLocaleString()} closes ${o.close_date}`,
          entity: 'opportunity',
          entity_id: o.id,
          priority: 'high',
        });
      } else if (days < 0) {
        items.push({
          id: `opp-overdue-${o.id}`,
          type: 'opportunity_overdue',
          title: `Deal past close date: ${o.name}`,
          detail: `${o.company} — was due ${o.close_date}`,
          entity: 'opportunity',
          entity_id: o.id,
          priority: 'high',
        });
      }
    });

    const leads = (await query(`SELECT * FROM leads WHERE status = 'new'`)).rows;
    leads.forEach((l) => {
      const created = new Date(l.created_at);
      const days = (now - created) / (1000 * 60 * 60 * 24);
      if (days >= 1) {
        items.push({
          id: `lead-stale-${l.id}`,
          type: 'lead_not_contacted',
          title: `Lead not contacted: ${l.name}`,
          detail: `${l.company || 'Unknown company'} — new for ${Math.floor(days)} day(s)`,
          entity: 'lead',
          entity_id: l.id,
          priority: 'medium',
        });
      }
    });

    items.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1));
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/done', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (id.startsWith('task-overdue-')) {
      const taskId = id.replace('task-overdue-', '');
      await query(`UPDATE tasks SET status='done', updated_at=NOW() WHERE id=$1`, [taskId]);
      await logAudit('update', 'task', taskId, 'Marked overdue task done via Act Now');
    } else if (id.startsWith('lead-stale-')) {
      const leadId = id.replace('lead-stale-', '');
      await query(`UPDATE leads SET status='contacted', updated_at=NOW() WHERE id=$1`, [leadId]);
      await logAudit('update', 'lead', leadId, 'Marked lead contacted via Act Now');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
