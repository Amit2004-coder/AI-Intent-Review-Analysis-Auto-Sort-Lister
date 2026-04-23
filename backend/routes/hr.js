const express = require('express');
const router = express.Router();
// HR-specific routes are in /api/jobs/my and /api/applications/job/:id
// This router exists for future HR-specific endpoints
router.get('/ping', (req, res) => res.json({ ok: true }));
module.exports = router;
