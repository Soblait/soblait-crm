const express = require('express');
const { query } = require('../db');
const { callClaude } = require('../lib/ai');
const { computeStats } = require('./dashboard');

const router = express.Router();

// Any AI-config error gets surfaced as a clear 503 the frontend can render nicely, instead of
// a generic 500 — everything else falls through to the normal error handler.
function handleAiError(err, res, next) {
  if (err.code === 'AI_NOT_CONFIGURED') {
    return res.status(503).json({ error: err.message, code: err.code });
  }
  next(err);
}

// Lets the frontend show a heads-up banner ("AI Tools aren't connected yet") without having to
// burn a real AI call just to find out the key is missing.
router.get('/status', (req, res) => {
  res.json({ configured: !!process.env.ANTHROPIC_API_KEY });
});

router.post('/brainstorm', async (req, res, next) => {
  try {
    const { projectName, topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic is required' });
    const system =
      'You are a sharp, concise brainstorming partner for a small product/sales team. Explore ' +
      'multiple angles, name real risks and opportunities, and end with 2-3 concrete next steps. ' +
      'Plain text only — no markdown headers or asterisks, use short paragraphs and simple dashes for lists.';
    const user = `${projectName ? `Project: ${projectName}\n` : ''}Help me brainstorm on: ${topic}`;
    const result = await callClaude(system, user, { maxTokens: 900 });
    res.json({ result });
  } catch (err) {
    handleAiError(err, res, next);
  }
});

router.post('/research', async (req, res, next) => {
  try {
    const { projectName, topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic is required' });
    const system =
      'You produce structured research briefs for a small product/sales team. Always cover, in ' +
      'this order: Overview, Key Risks, Opportunities, Recommended Next Steps. Plain text only — ' +
      'no markdown headers or asterisks, use a plain label per section and simple dashes for lists.';
    const user = `${projectName ? `Project: ${projectName}\n` : ''}Research topic: ${topic}`;
    const result = await callClaude(system, user, { maxTokens: 1100 });
    res.json({ result });
  } catch (err) {
    handleAiError(err, res, next);
  }
});

router.post('/plan-to-tasks', async (req, res, next) => {
  try {
    const { projectName, plan } = req.body;
    if (!plan) return res.status(400).json({ error: 'plan is required' });
    const system =
      'Convert a rough plan into a task list. Respond with ONLY valid JSON — no prose, no markdown ' +
      'code fences — as an array of objects shaped like {"title": "...", "owner": "...", "priority": ' +
      '"high" | "medium" | "low"}. Keep titles short and actionable. 4-10 tasks.';
    const user = `${projectName ? `Project: ${projectName}\n` : ''}Plan:\n${plan}`;
    const raw = await callClaude(system, user, { maxTokens: 800 });
    let tasks = [];
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) tasks = parsed;
    } catch {
      tasks = [];
    }
    res.json({ tasks, raw });
  } catch (err) {
    handleAiError(err, res, next);
  }
});

router.post('/summarize', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const system =
      'Condense the given notes, meeting transcript, or thread into a tight summary: key points, ' +
      'decisions made, and open questions. Plain text only — no markdown headers or asterisks.';
    const result = await callClaude(system, text, { maxTokens: 700 });
    res.json({ result });
  } catch (err) {
    handleAiError(err, res, next);
  }
});

router.post('/dashboard-insight', async (req, res, next) => {
  try {
    const stats = await computeStats();
    const system =
      'You are a sales/product-ops analyst reviewing a small company\'s portfolio stats. Give a ' +
      'short, specific narrative: what stands out, what to watch, and one concrete recommendation. ' +
      'Plain text only, no markdown, under 200 words.';
    const user =
      `Total won revenue: $${stats.totalRevenue}\n` +
      `Deals won: ${stats.dealsWon}\n` +
      `Ideas: ${stats.ideasCount} (value $${stats.ideasValue})\n` +
      `Active projects: ${stats.activeProjectsCount} (value $${stats.activeProjectsValue})\n` +
      `Active leads: ${stats.activeLeads}\n` +
      `Value by stage: ${JSON.stringify(stats.byStage)}`;
    const result = await callClaude(system, user, { maxTokens: 500 });
    res.json({ result });
  } catch (err) {
    handleAiError(err, res, next);
  }
});

// Generic runner used by the Prompt Library — takes whatever prompt text the user has edited
// (filled in from a saved template) and runs it directly.
router.post('/run', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    const system =
      'You are a helpful, concise assistant for a small product/sales team. Respond in plain text ' +
      '(no markdown headers or asterisks), be specific and actionable.';
    const result = await callClaude(system, prompt, { maxTokens: 900 });
    res.json({ result });
  } catch (err) {
    handleAiError(err, res, next);
  }
});

router.get('/prompts', async (req, res, next) => {
  try {
    const rows = (await query('SELECT * FROM prompt_library ORDER BY created_at DESC')).rows;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/prompts', async (req, res, next) => {
  try {
    const { title, prompt, category } = req.body;
    if (!title || !prompt) return res.status(400).json({ error: 'title and prompt are required' });
    const result = await query(
      'INSERT INTO prompt_library (title, prompt, category) VALUES ($1,$2,$3) RETURNING id',
      [title, prompt, category || 'general']
    );
    const row = (await query('SELECT * FROM prompt_library WHERE id = $1', [result.rows[0].id])).rows[0];
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

router.delete('/prompts/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM prompt_library WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
