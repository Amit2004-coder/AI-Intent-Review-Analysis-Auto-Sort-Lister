const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// ── Middleware ──────────────────────────────────────────────────────────────
const candidateAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    if (decoded.type !== 'candidate') return res.status(401).json({ success: false, message: 'Not candidate' });
    req.candidateId = decoded.id;
    next();
  } catch { return res.status(401).json({ success: false, message: 'Token invalid' }); }
};

// ── HR: Send message to candidate ───────────────────────────────────────────
router.post('/hr', protect, async (req, res) => {
  try {
    const { applicationId, text } = req.body;
    const app = await Application.findById(applicationId).populate('job');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const msg = await Message.create({
      application: applicationId,
      job: app.job._id,
      senderRole: 'hr',
      senderName: req.user.name,
      text,
    });
    res.status(201).json({ success: true, message: msg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── HR: Toggle messaging for a candidate ────────────────────────────────────
router.put('/hr/toggle-messaging/:applicationId', protect, async (req, res) => {
  try {
    const app = await Application.findById(req.params.applicationId).populate('job');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    // Only the HR who owns the job can toggle
    if (app.job.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    app.messagingDisabled = !app.messagingDisabled;
    await app.save();

    res.json({
      success: true,
      messagingDisabled: app.messagingDisabled,
      message: app.messagingDisabled ? 'Messaging disabled for candidate' : 'Messaging re-enabled for candidate',
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Candidate: Reply to HR (blocked if disabled) ─────────────────────────────
router.post('/candidate', candidateAuth, async (req, res) => {
  try {
    const { applicationId, text } = req.body;
    const app = await Application.findById(applicationId).populate('candidate', 'name');
    if (!app) return res.status(404).json({ success: false, message: 'Not found' });
    if (app.candidate._id.toString() !== req.candidateId.toString())
      return res.status(403).json({ success: false, message: 'Not your application' });

    // Check if messaging is disabled by HR
    if (app.messagingDisabled)
      return res.status(403).json({ success: false, message: 'Messaging has been disabled by HR for this application', messagingDisabled: true });

    // Candidate can only reply if HR has sent at least one message first
    const hrMsgExists = await Message.findOne({ application: applicationId, senderRole: 'hr' });
    if (!hrMsgExists)
      return res.status(403).json({ success: false, message: 'You can only reply after HR sends a message first', noHrMessage: true });

    const msg = await Message.create({
      application: applicationId,
      job: app.job,
      senderRole: 'candidate',
      senderName: app.candidate.name || app.fullName,
      text,
    });
    res.status(201).json({ success: true, message: msg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Get messages for an application ─────────────────────────────────────────
router.get('/:applicationId', async (req, res) => {
  try {
    const msgs = await Message.find({ application: req.params.applicationId }).sort({ createdAt: 1 });
    // Also return messaging status
    const app = await Application.findById(req.params.applicationId).select('messagingDisabled');
    res.json({ success: true, messages: msgs, messagingDisabled: app?.messagingDisabled || false });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Mark messages as read ────────────────────────────────────────────────────
router.put('/mark-read/:applicationId', async (req, res) => {
  try {
    const { role } = req.body; // 'hr' or 'candidate'
    // Mark all messages from the OTHER role as read
    const senderRole = role === 'hr' ? 'candidate' : 'hr';
    await Message.updateMany({ application: req.params.applicationId, senderRole, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── HR: All threads (for Inbox page) ────────────────────────────────────────
router.get('/hr/threads', protect, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const jobs = await Job.find({ postedBy: req.user._id }).select('_id');
    const jobIds = jobs.map(j => j._id);

    // Only show applications that have at least one message
    const appsWithMsgs = await Message.distinct('application');
    const apps = await Application.find({
      job: { $in: jobIds },
      _id: { $in: appsWithMsgs },
    })
      .select('fullName email job scores status aiRecommendation candidate messagingDisabled')
      .populate('job', 'title')
      .populate('candidate', 'name avatar');

    // Attach last message + unread count
    const threads = await Promise.all(apps.map(async app => {
      const lastMsg = await Message.findOne({ application: app._id }).sort({ createdAt: -1 });
      const unread = await Message.countDocuments({ application: app._id, senderRole: 'candidate', isRead: false });
      return { ...app.toObject(), lastMessage: lastMsg, unreadCount: unread };
    }));

    res.json({ success: true, threads });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Candidate: Inbox — threads where HR has messaged them ───────────────────
router.get('/candidate/inbox', candidateAuth, async (req, res) => {
  try {
    // Only apps where HR has sent at least one message
    const appsWithHRMsg = await Message.distinct('application', { senderRole: 'hr' });
    const apps = await Application.find({
      candidate: req.candidateId,
      _id: { $in: appsWithHRMsg },
    })
      .populate('job', 'title company location')
      .lean();

    const threads = await Promise.all(apps.map(async app => {
      const lastMsg = await Message.findOne({ application: app._id }).sort({ createdAt: -1 });
      const unread = await Message.countDocuments({ application: app._id, senderRole: 'hr', isRead: false });
      const msgDisabled = await Application.findById(app._id).select('messagingDisabled');
      return {
        ...app,
        lastMessage: lastMsg,
        unreadCount: unread,
        messagingDisabled: msgDisabled?.messagingDisabled || false,
      };
    }));

    res.json({ success: true, threads: threads.filter(t => t.lastMessage) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
