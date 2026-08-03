const express = require('express');
const { query } = require('../db');

const router = express.Router();

async function computeStats() {
  const leads = (await query('SELECT * FROM leads')).rows;
  const opportunities = (await query('SELECT * FROM opportunities')).rows;

  const totalRevenue = opportunities
    .filter((o) => o.stage === 'Closed Won')
    .reduce((sum, o) => sum + (o.value || 0), 0);

  const activeLeads = leads.filter((l) => l.status !== 'unqualified').length;
  const dealsWon = opportunities.filter((o) => o.stage === 'Closed Won').length;

  const pipelineValue = opportunities
    .filter((o) => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost')
    .reduce((sum, o) => sum + (o.value || 0), 0);

  const today = new Date().toISOString().slice(0, 10);
  const newLeadsToday = leads.filter((l) => (l.created_at ? l.created_at.toISOString().slice(0, 10) : '') === today).length;

  const byStage = {};
  opportunities.forEach((o) => {
    byStage[o.stage] = (byStage[o.stage] || 0) + o.value;
  });

  return { leads, opportunities, totalRevenue, activeLeads, dealsWon, pipelineValue, newLeadsToday, byStage };
}

router.get('/stats', async (req, res, next) => {
  try {
    const { totalRevenue, activeLeads, dealsWon, pipelineValue, newLeadsToday } = await computeStats();
    res.json({ totalRevenue, activeLeads, dealsWon, pipelineValue, newLeadsToday });
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
      reply = `Here's your pipeline summary:\n\nTotal open pipeline value: $${stats.pipelineValue.toLocaleString()}\nTotal closed-won revenue: $${stats.totalRevenue.toLocaleString()}\nActive leads: ${stats.activeLeads}\n\nBy stage:\n${stageLines || '  (no opportunities yet)'}`;
    } else if (msg.includes('focus') || msg.includes('today') || msg.includes('priorit')) {
      const closingSoon = stats.opportunities.filter((o) => {
        if (!o.close_date) return false;
        const days = (new Date(o.close_date) - new Date()) / (1000 * 60 * 60 * 24);
        return days >= 0 && days <= 7 && o.stage !== 'Closed Won' && o.stage !== 'Closed Lost';
      });
      const newLeads = stats.leads.filter((l) => l.status === 'new');
      reply = `Here's what I'd focus on today:\n\n${closingSoon.length ? `• ${closingSoon.length} deal(s) closing within 7 days: ${closingSoon.map((o) => o.name).join(', ')}` : '• No deals closing in the next 7 days.'}\n${newLeads.length ? `• ${newLeads.length} new lead(s) awaiting first contact: ${newLeads.map((l) => l.name).join(', ')}` : '• No new leads waiting on outreach.'}\n\nTackle the closing deals first — they have the most revenue at stake.`;
    } else if (msg.includes('follow') || msg.includes('email') || msg.includes('draft')) {
      const lead = stats.leads[0];
      reply = lead
        ? `Here's a draft follow-up email for ${lead.name} at ${lead.company || 'their company'}:\n\nSubject: Following up on our conversation\n\nHi ${lead.name.split(' ')[0]},\n\nI wanted to follow up and see if you had any questions about how Soblait could help ${lead.company || 'your team'}. Happy to jump on a quick call this week if useful.\n\nBest,\nYour Soblait team`
        : `I'd love to draft a follow-up, but there are no leads yet — add one on the Leads page and ask me again.`;
    } else if (msg.includes('risk')) {
      const atRisk = stats.opportunities.filter((o) => {
        if (o.stage === 'Closed Won' || o.stage === 'Closed Lost') return false;
        if (!o.close_date) return false;
        return new Date(o.close_date) < new Date();
      });
      reply = atRisk.length
        ? `These deals look at risk (past their close date and not yet closed):\n\n${atRisk.map((o) => `• ${o.name} (${o.company}) — was due ${o.close_date}, worth $${o.value.toLocaleString()}`).join('\n')}`
        : `Good news — I don't see any deals past their close date right now.`;
    } else {
      reply = `I can help summarize your pipeline, tell you what to focus on today, draft a follow-up email, or flag deals at risk. Try one of the quick-suggestion buttons, or ask me directly!`;
    }

    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
