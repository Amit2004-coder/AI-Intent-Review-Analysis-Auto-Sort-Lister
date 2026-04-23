const express = require('express');
const router = express.Router();
const CandidateProfile = require('../models/CandidateProfile');
const Job = require('../models/Job');
const jwt = require('jsonwebtoken');
const { upload } = require('../middleware/upload');

const sign = (id) => jwt.sign({ id, type: 'candidate' }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    if (decoded.type !== 'candidate') return res.status(401).json({ success: false, message: 'Not a candidate token' });
    req.candidate = await CandidateProfile.findById(decoded.id);
    if (!req.candidate) return res.status(401).json({ success: false, message: 'Not found' });
    next();
  } catch { return res.status(401).json({ success: false, message: 'Token invalid' }); }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields required' });
    if (await CandidateProfile.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });
    const candidate = await CandidateProfile.create({ name, email, password });
    res.status(201).json({ success: true, token: sign(candidate._id), candidate });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const candidate = await CandidateProfile.findOne({ email }).select('+password');
    if (!candidate || !(await candidate.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, token: sign(candidate._id), candidate: candidate.toJSON() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Me
router.get('/me', auth, (req, res) => res.json({ success: true, candidate: req.candidate }));

// Update profile (text fields + projects)
router.put('/profile', auth, async (req, res) => {
  try {
    const allowed = ['name','phone','bio','location','currentRole','currentCompany','experience','education','skills','github','linkedin','portfolio','expectedSalary','noticePeriod','projects'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const merged = { ...req.candidate.toObject(), ...updates };
    updates.isProfileComplete = !!(merged.skills?.length && merged.resume && merged.education);
    const c = await CandidateProfile.findByIdAndUpdate(req.candidate._id, updates, { new: true, runValidators: true });
    res.json({ success: true, candidate: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Upload avatar
router.put('/avatar', auth, upload('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
    const c = await CandidateProfile.findByIdAndUpdate(req.candidate._id, { avatar: `/uploads/${req.file.filename}` }, { new: true });
    res.json({ success: true, candidate: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Upload resume
router.put('/resume', auth, upload('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
    const c = await CandidateProfile.findByIdAndUpdate(req.candidate._id, { resume: `/uploads/${req.file.filename}`, isProfileComplete: true }, { new: true });
    res.json({ success: true, candidate: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Browse jobs (public-ish — candidate sees all active jobs)
router.get('/jobs', auth, async (req, res) => {
  try {
    const { search = '', skills = '', location = '', jobType = '', workMode = '', page = 1, limit = 12 } = req.query;
    const query = { isActive: true, linkExpiry: { $gt: new Date() } };
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    if (skills) query.skills = { $in: skills.split(',').map(s => new RegExp(s.trim(), 'i')) };
    if (location) query.location = { $regex: location, $options: 'i' };
    if (jobType) query.jobType = jobType;
    if (workMode) query.workMode = workMode;

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .select('title company location jobType workMode skills salaryMin salaryMax salaryVisible experienceMin experienceMax openings totalApplications views applicationToken createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Check which jobs candidate already applied to
    const Application = require('../models/Application');
    const appliedJobs = await Application.find({ candidate: req.candidate._id }).select('job');
    const appliedIds = appliedJobs.map(a => a.job.toString());

    const enriched = jobs.map(j => ({
      ...j.toObject(),
      alreadyApplied: appliedIds.includes(j._id.toString()),
      applyLink: `/apply/${j.applicationToken}`,
    }));

    res.json({ success: true, jobs: enriched, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Get single job detail (for candidate)
router.get('/jobs/:jobId', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job || !job.isActive) return res.status(404).json({ success: false, message: 'Job not found' });
    const Application = require('../models/Application');
    const alreadyApplied = !!(await Application.findOne({ job: job._id, candidate: req.candidate._id }));
    res.json({ success: true, job: { ...job.toObject(), alreadyApplied, applyLink: `/apply/${job.applicationToken}` } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = { router, auth };
