const express = require('express');
const { query } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const projects = (await query('SELECT * FROM projects')).rows;

    const activeProjects = projects.filter((p) => p.stage === 'active').length;
    const wonProjects = projects.filter((p) => p.stage === 'won').length;
    const totalRevenue = projects
      .filter((p) => p.stage === 'won')
      .reduce((sum, p) => sum + (p.value || 0), 0);

    const stages = (await query('SELECT name FROM pipeline_stages ORDER BY position ASC')).rows.map((s) => s.name);
    const pipelineByStage = stages.map((stage) => ({
      stage,
      value: projects.filter((p) => p.stage === stage).reduce((sum, p) => sum + (p.value || 0), 0),
      count: projects.filter((p) => p.stage === stage).length,
    }));

    res.json({
      activeProjects,
      wonProjects,
      totalRevenue,
      pipelineByStage,
      projects,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
