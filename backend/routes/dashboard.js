const express = require('express');
const { query } = require('../db');

const router = express.Router();

async function computeStats() {
  const leads = (await query('SELECT * FROM leads')).rows;
  const projects = (await query('SELECT * FROM projects')).rows;

  // Only Won projects count toward revenue and deals-won — delivered and/or paid.
  const wonProjects = projects.filter((p) => p.stage === 'won');
  const totalRevenue = wonProjects.reduce((sum, p) => sum + (p.value || 0), 0);
  const dealsWon = wonProjects.length;

  const ideaProjects = projects.filter((p) => p.stage === 'idea');
  const activeProjectsList = projects.filter((p) => p.stage === 'active');
  const ideasCount = ideaProjects.length;
  const activeProjectsCount = activeProjectsList.length;
  const ideasValue = ideaProjects.reduce((sum, p) => sum + (p.value || 0), 0);
  const activeProjectsValue = activeProjectsList.reduce((sum, p) => sum + (p.value || 0), 0);

  const activeLeads = leads.filter((l) => l.status !== 'unqualified').length;

  const today = new Date().toISOString().slice(0, 10);
  const newLeadsToday = leads.filter((l) => (l.created_at ? l.created_at.toISOString().slice(0, 10) : '') === today).length;

  const byStage = {};
  projects.forEach((p) => {
    byStage[p.stage] = (byStage[p.stage] || 0) + (p.value || 0);
  });

  return {
    leads,
    projects,
    totalRevenue,
    dealsWon,
    ideasCount,
    activeProjectsCount,
    ideasValue,
    activeProjectsValue,
    activeLeads,
    newLeadsToday,
    byStage,
  };
}

router.get('/stats', async (req, res, next) => {
  try {
    const { totalRevenue, dealsWon, ideasCount, activeProjectsCount, ideasValue, activeProjectsValue, activeLeads, newLeadsToday } =
      await computeStats();
    res.json({ totalRevenue, dealsWon, ideasCount, activeProjectsCount, ideasValue, activeProjectsValue, activeLeads, newLeadsToday });
  } catch (err) {
    next(err);
  }
});

router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;
    const stats = await computeStats();
    const msg = (message || '').toLowerCase();

    let reply;
    if (msg.includes('pipeline') || msg.includes('summar')) {
      const stageLines = Object.entries(stats.byStage)
        .map(([stage, value]) => `  • ${stage}: $${value.toLocaleString()}`)
        .join('\n');
      reply = `Here's your project summary:\n\nActive project value: $${stats.activeProjectsValue.toLocaleString()} (${stats.activeProjectsCount} project(s))\nIdeas value: $${stats.ideasValue.toLocaleString()} (${stats.ideasCount} idea(s))\nTotal won revenue: $${stats.totalRevenue.toLocaleString()} (${stats.dealsWon} deal(s))\nActive leads: ${stats.activeLeads}\n\nBy stage:\n${stageLines || '  (no projects yet)'}`;
    } else if (msg.includes('focus') || msg.includes('today') || msg.includes('priorit')) {
      const closingSoon = stats.projects.filter((p) => {
        if (p.stage !== 'active' || !p.close_date) return false;
        const days = (new Date(p.close_date) - new Date()) / (1000 * 60 * 60 * 24);
        return days >= 0 && days <= 7;
      });
      const newLeads = stats.leads.filter((l) => l.status === 'new');
      reply = `Here's what I'd focus on today:\n\n${closingSoon.length ? `• ${closingSoon.length} active project(s) targeted to wrap up within 7 days: ${closingSoon.map((p) => p.name).join(', ')}` : '• No active projects targeted to wrap up in the next 7 days.'}\n${newLeads.length ? `• ${newLeads.length} new lead(s) awaiting first contact: ${newLeads.map((l) => l.name).join(', ')}` : '• No new leads waiting on outreach.'}\n\nTackle the projects closing in on their target date first — that's where delivery (and revenue) is most at stake.`;
    } else if (msg.includes('follow') || msg.includes('email') || msg.includes('draft')) {
      const lead = stats.leads[0];
      reply = lead
        ? `Here's a draft follow-up email for ${lead.name} at ${lead.company || 'their company'}:\n\nSubject: Following up on our conversation\n\nHi ${lead.name.split(' ')[0]},\n\nI wanted to follow up and see if you had any questions about how Soblait could help ${lead.company || 'your team'}. Happy to jump on a quick call this week if useful.\n\nBest,\nYour Soblait team`
        : `I'd love to draft a follow-up, but there are no leads yet — add one on the Leads page and ask me again.`;
    } else if (msg.includes('risk')) {
      const atRisk = stats.projects.filter((p) => {
        if (p.stage !== 'active') return false;
        const noDemo = !p.demo_done;
        const overdue = p.close_date && new Date(p.close_date) < new Date();
        return noDemo || overdue;
      });
      reply = atRisk.length
        ? `These active projects look at risk (no demo done yet and/or past their target date):\n\n${atRisk
            .map(
              (p) =>
                `• ${p.name} (${p.company}) — ${p.demo_done ? 'demo done' : 'no demo yet'}${
                  p.close_date ? `, target date ${p.close_date}` : ''
                }, worth $${(p.value || 0).toLocaleString()}`
            )
            .join('\n')}`
        : `Good news — I don't see any active projects at risk right now.`;
    } else {
      reply = `I can help summarize your projects, tell you what to focus on today, draft a follow-up email, or flag active projects at risk. Try one of the quick-suggestion buttons, or ask me directly!`;
    }

    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

// Exposed so routes/aiTools.js can reuse the exact same portfolio stats for "Dashboard Insight"
// instead of recomputing them differently.
module.exports = router;
module.exports.computeStats = computeStats;
