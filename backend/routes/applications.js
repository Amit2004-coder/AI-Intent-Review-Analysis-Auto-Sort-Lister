const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { analyzeApplication } = require('../controllers/aiEngine');

// CANDIDATE PROTECTED: Submit application (must be logged in as candidate)
router.post('/submit/:token', upload('resume'), async (req, res) => {
  try {
    // candidate auth check
    const jwt = require('jsonwebtoken');
    let candidateId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret123');
        if (decoded.type === 'candidate') candidateId = decoded.id;
      } catch {}
    }
    if (!candidateId) {
      return res.status(401).json({ success: false, message: 'Please login as a candidate to apply', requireLogin: true });
    }

    const job = await Job.findOne({ applicationToken: req.params.token });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (!job.isActive) return res.status(410).json({ success: false, message: 'Job is closed' });
    if (job.linkExpiry < new Date()) return res.status(410).json({ success: false, message: 'Application link expired' });

    // duplicate check by candidate id
    const existing = await Application.findOne({ job: job._id, candidate: candidateId });
    if (existing) return res.status(400).json({ success: false, message: 'You have already applied for this position' });

    const { fullName, email, phone, currentRole, currentCompany, experience,
            education, skills, github, linkedin, portfolio, projects,
            coverLetter, expectedSalary, noticePeriod, location, intentData } = req.body;

    const skillsArr = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : (skills || []);
    const parsedIntent = intentData ? (typeof intentData === 'string' ? JSON.parse(intentData) : intentData) : {};
    let parsedProjects = [];
    try { parsedProjects = projects ? (typeof projects === 'string' ? JSON.parse(projects) : projects) : []; } catch {}

    const appData = {
      job: job._id,
      candidate: candidateId,
      fullName, email, phone: phone || '',
      currentRole: currentRole || '', currentCompany: currentCompany || '',
      experience: parseInt(experience) || 0, education: education || '',
      skills: skillsArr, github: github || '', linkedin: linkedin || '',
      portfolio: portfolio || '', projects: parsedProjects,
      coverLetter: coverLetter || '',
      expectedSalary: parseInt(expectedSalary) || 0,
      noticePeriod: noticePeriod || '', location: location || '',
      intentData: parsedIntent,
      resume: req.file ? `/uploads/${req.file.filename}` : '',
    };

    const application = await Application.create(appData);

    // Run AI Analysis async
    try {
      const result = await analyzeApplication({ ...appData, resumeText: '' }, job);
      await Application.findByIdAndUpdate(application._id, {
        scores: result.scores,
        aiRecommendation: result.aiRecommendation,
        aiSummary: result.aiSummary,
        aiStrengths: result.aiStrengths,
        aiWeaknesses: result.aiWeaknesses,
        isShortlisted: result.isShortlisted,
        githubDetails: result.githubDetails || {},
        status: 'screening',
        aiAnalyzedAt: new Date(),
      });
      await Job.findByIdAndUpdate(job._id, { $inc: { totalApplications: 1 } });
    } catch (aiErr) { console.log('AI error:', aiErr.message); }

    res.status(201).json({ success: true, message: 'Application submitted successfully!' });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'You have already applied for this position' });
    res.status(500).json({ success: false, message: e.message });
  }
});

// HR: Get ranked applicants with filters
router.get('/job/:jobId', protect, async (req, res) => {
  try {
    const { filter = 'all', search = '', minExp = '', maxExp = '', skill = '', sort = '-scores.finalScore' } = req.query;
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const query = { job: req.params.jobId };
    if (filter !== 'all') query.aiRecommendation = filter;
    if (search) query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { currentRole: { $regex: search, $options: 'i' } },
      { skills: { $in: [new RegExp(search, 'i')] } },
    ];
    if (minExp !== '') query.experience = { ...query.experience, $gte: parseInt(minExp) };
    if (maxExp !== '') query.experience = { ...query.experience, $lte: parseInt(maxExp) };
    if (skill) query.skills = { $in: [new RegExp(skill, 'i')] };

    const applications = await Application.find(query)
      .populate('candidate', 'name email avatar phone skills experience github linkedin portfolio projects resume bio education')
      .sort(sort).lean();

    const allApps = await Application.find({ job: req.params.jobId });
    const stats = {
      total: allApps.length,
      top: allApps.filter(a => a.aiRecommendation === 'top').length,
      good: allApps.filter(a => a.aiRecommendation === 'good').length,
      average: allApps.filter(a => a.aiRecommendation === 'average').length,
      rejected: allApps.filter(a => a.aiRecommendation === 'rejected').length,
      shortlisted: allApps.filter(a => a.isShortlisted).length,
    };

    res.json({ success: true, applications, stats, job });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// HR: Get single application with full candidate profile
router.get('/:id', protect, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('candidate', 'name email avatar phone skills experience github linkedin portfolio projects resume bio education currentRole currentCompany')
      .populate('job', 'title company');
    if (!app) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, application: app });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// HR: Update status (also makes status visible to candidate)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const updates = {
      status: req.body.status,
      hrNotes: req.body.hrNotes,
      hrStatusVisible: true,            // candidate can now see status
    };
    // Shortlist only when HR explicitly sets it
    if (req.body.status === 'shortlisted' || req.body.status === 'interview' || req.body.status === 'offered') {
      updates.isShortlisted = true;
    }
    if (req.body.status === 'rejected') {
      updates.isShortlisted = false;
    }
    const app = await Application.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, application: app });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// HR stats
router.get('/hr/stats', protect, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).select('_id title');
    const jobIds = jobs.map(j => j._id);
    const total = await Application.countDocuments({ job: { $in: jobIds } });
    const shortlisted = await Application.countDocuments({ job: { $in: jobIds }, isShortlisted: true });
    const top = await Application.countDocuments({ job: { $in: jobIds }, aiRecommendation: 'top' });
    const recent = await Application.find({ job: { $in: jobIds } })
      .sort({ createdAt: -1 }).limit(8)
      .populate('job', 'title company').lean();
    res.json({ success: true, stats: { total, shortlisted, top, jobs: jobs.length }, recent });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Candidate: My applications (status only shown after HR takes action)
router.get('/candidate/mine', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    if (decoded.type !== 'candidate') return res.status(401).json({ success: false, message: 'Not a candidate' });

    const apps = await Application.find({ candidate: decoded.id })
      .populate('job', 'title company location jobType workMode salaryMin salaryMax skills experienceMin experienceMax')
      .sort({ createdAt: -1 })
      .lean();

    // Strip sensitive info until HR has taken action
    const sanitized = apps.map(app => ({
      ...app,
      // Hide AI score from candidate always
      scores: undefined,
      aiRecommendation: undefined,
      aiStrengths: undefined,
      aiWeaknesses: undefined,
      aiSummary: undefined,
      githubDetails: undefined,
      // Hide shortlist / status until HR explicitly acts
      isShortlisted: app.hrStatusVisible ? app.isShortlisted : false,
      status: app.hrStatusVisible ? app.status : 'applied',
      hrNotes: undefined,
    }));

    res.json({ success: true, applications: sanitized });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});


// HR: Detailed job status overview (Req 4)
router.get('/job-status/:jobId', protect, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const all = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email avatar')
      .sort('-scores.finalScore')
      .lean();

    const stats = {
      total:       all.length,
      shortlisted: all.filter(a => a.status === 'shortlisted' || a.status === 'interview' || a.status === 'offered').length,
      interview:   all.filter(a => a.status === 'interview').length,
      offered:     all.filter(a => a.status === 'offered').length,
      rejected:    all.filter(a => a.status === 'rejected').length,
      pending:     all.filter(a => a.status === 'applied' || a.status === 'screening').length,
      top:         all.filter(a => a.aiRecommendation === 'top').length,
      good:        all.filter(a => a.aiRecommendation === 'good').length,
      average:     all.filter(a => a.aiRecommendation === 'average').length,
      avgScore:    all.length > 0
        ? Math.round(all.reduce((s, a) => s + (a.scores?.finalScore || 0), 0) / all.length)
        : 0,
    };

    res.json({ success: true, job, stats, applications: all });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
