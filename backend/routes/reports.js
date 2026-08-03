const express = require('express');
const { query } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const opportunities = (await query('SELECT * FROM opportunities')).rows;

    const openOpportunities = opportunities.filter((o) => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost').length;
    const closedWonDeals = opportunities.filter((o) => o.stage === 'Closed Won').length;
    const totalRevenue = opportunities
      .filter((o) => o.stage === 'Closed Won')
      .reduce((sum, o) => sum + (o.value || 0), 0);

    const stages = (await query('SELECT name FROM pipeline_stages ORDER BY position ASC')).rows.map((s) => s.name);
    const pipelineByStage = stages.map((stage) => ({
      stage,
      value: opportunities.filter((o) => o.stage === stage).reduce((sum, o) => sum + (o.value || 0), 0),
      count: opportunities.filter((o) => o.stage === stage).length,
    }));

    res.json({
      openOpportunities,
      closedWonDeals,
      totalRevenue,
      pipelineByStage,
      opportunities,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
