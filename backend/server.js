require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { initDb } = require('./db');
const { authMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const opportunitiesRoutes = require('./routes/opportunities');
const tasksRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const actNowRoutes = require('./routes/actNow');
const calendarRoutes = require('./routes/calendar');
const reportsRoutes = require('./routes/reports');
const automationsRoutes = require('./routes/automations');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'soblait-crm-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/leads', authMiddleware, leadsRoutes);
app.use('/api/opportunities', authMiddleware, opportunitiesRoutes);
app.use('/api/tasks', authMiddleware, tasksRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/act-now', authMiddleware, actNowRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);
app.use('/api/automations', authMiddleware, automationsRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function bootstrap() {
  await initDb(); // ensures DB is migrated + seeded before the server accepts requests
  app.listen(PORT, () => {
    console.log(`Soblait CRM backend running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
