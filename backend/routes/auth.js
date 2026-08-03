const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    const existing = (await query('SELECT id FROM users WHERE email = $1', [email])).rows[0];
    if (existing) return res.status(409).json({ error: 'A user with that email already exists' });

    const hash = bcrypt.hashSync(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id',
      [name, email, hash, 'Sales Rep']
    );
    const user = { id: result.rows[0].id, name, email, role: 'Sales Rep' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const row = (await query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = bcrypt.compareSync(password, row.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const row = (await query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id])).rows[0];
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
