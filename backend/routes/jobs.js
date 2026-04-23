const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');

// PROTECTED: HR gets their own jobs — must be BEFORE /:id
router.get('/my', protect, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    const now = new Date();
    const enriched = jobs.map(j => ({
      ...j.toObject(),
      isExpired: j.linkExpiry < now,
      applyLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/apply/${j.applicationToken}`,
    }));
    res.json({ success: true, jobs: enriched });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUBLIC: Get job by application token
router.get('/apply/:token', async (req, res) => {
  try {
    const job = await Job.findOne({ applicationToken: req.params.token }).populate('postedBy', 'name company');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (!job.isActive) return res.status(410).json({ success: false, message: 'This job is closed' });
    if (job.linkExpiry < new Date()) return res.status(410).json({ success: false, message: 'Application link has expired' });
    job.views += 1;
    await job.save({ validateBeforeSave: false });
    res.json({ success: true, job });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PROTECTED: HR creates job
router.post('/', protect, async (req, res) => {
  try {
    const { title, company, description, requirements, responsibilities,
            skills, experienceMin, experienceMax, salaryMin, salaryMax,
            salaryVisible, location, jobType, workMode, openings, category, linkExpiry } = req.body;
    if (!title || !company || !description || !linkExpiry)
      return res.status(400).json({ success: false, message: 'Title, company, description and expiry required' });
    const job = await Job.create({
      title, company, description, requirements, responsibilities,
      skills: Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean),
      experienceMin: experienceMin || 0, experienceMax: experienceMax || 10,
      salaryMin: salaryMin || 0, salaryMax: salaryMax || 0,
      salaryVisible: salaryVisible !== false,
      location: location || 'Remote', jobType: jobType || 'Full-time',
      workMode: workMode || 'Remote', openings: openings || 1,
      category: category || 'Technology',
      linkExpiry: new Date(linkExpiry),
      postedBy: req.user._id,
    });
    const applyLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/apply/${job.applicationToken}`;
    res.status(201).json({ success: true, job, applyLink });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PROTECTED: Update job
router.put('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Not found' });
    if (job.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, job: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PROTECTED: Delete job
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Not found' });
    if (job.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
