const express = require('express');
const { query, logAudit } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const clients = (await query('SELECT * FROM clients ORDER BY created_at DESC')).rows;
    const features = (await query('SELECT * FROM client_features ORDER BY created_at ASC')).rows;
    const withFeatures = clients.map((c) => ({
      ...c,
      features: features.filter((f) => f.client_id === c.id),
    }));
    res.json(withFeatures);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const client = (await query('SELECT * FROM clients WHERE id = $1', [req.params.id])).rows[0];
    if (!client) return res.status(404).json({ error: 'Client not found' });
    const features = (await query('SELECT * FROM client_features WHERE client_id = $1 ORDER BY created_at ASC', [req.params.id])).rows;
    res.json({ ...client, features });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, contact_name, contact_email, project_id, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await query(
      `INSERT INTO clients (name, contact_name, contact_email, project_id, notes) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [name, contact_name || '', contact_email || '', project_id || null, notes || '']
    );
    const client = (await query('SELECT * FROM clients WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit('create', 'client', client.id, `Added client ${client.name}`);
    res.status(201).json({ ...client, features: [] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM clients WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Client not found' });
    const { name, contact_name, contact_email, project_id, notes } = req.body;
    await query(
      `UPDATE clients SET name=$1, contact_name=$2, contact_email=$3, project_id=$4, notes=$5, updated_at=NOW() WHERE id=$6`,
      [
        name ?? existing.name,
        contact_name ?? existing.contact_name,
        contact_email ?? existing.contact_email,
        project_id !== undefined ? project_id : existing.project_id,
        notes ?? existing.notes,
        req.params.id,
      ]
    );
    const updated = (await query('SELECT * FROM clients WHERE id = $1', [req.params.id])).rows[0];
    await logAudit('update', 'client', updated.id, `Updated client ${updated.name}`);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM clients WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Client not found' });
    await query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    await logAudit('delete', 'client', req.params.id, `Deleted client ${existing.name}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- Feature checklist, nested under a client ---

router.post('/:id/features', async (req, res, next) => {
  try {
    const client = (await query('SELECT * FROM clients WHERE id = $1', [req.params.id])).rows[0];
    if (!client) return res.status(404).json({ error: 'Client not found' });
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const result = await query(
      `INSERT INTO client_features (client_id, title) VALUES ($1,$2) RETURNING id`,
      [req.params.id, title]
    );
    const feature = (await query('SELECT * FROM client_features WHERE id = $1', [result.rows[0].id])).rows[0];
    await logAudit('create', 'client_feature', feature.id, `Added feature "${title}" for ${client.name}`);
    res.status(201).json(feature);
  } catch (err) {
    next(err);
  }
});

router.put('/features/:featureId', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM client_features WHERE id = $1', [req.params.featureId])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Feature not found' });
    const { title, done } = req.body;
    await query('UPDATE client_features SET title=$1, done=$2 WHERE id=$3', [
      title ?? existing.title,
      done !== undefined ? (done ? 1 : 0) : existing.done,
      req.params.featureId,
    ]);
    const updated = (await query('SELECT * FROM client_features WHERE id = $1', [req.params.featureId])).rows[0];
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/features/:featureId', async (req, res, next) => {
  try {
    const existing = (await query('SELECT * FROM client_features WHERE id = $1', [req.params.featureId])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Feature not found' });
    await query('DELETE FROM client_features WHERE id = $1', [req.params.featureId]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
