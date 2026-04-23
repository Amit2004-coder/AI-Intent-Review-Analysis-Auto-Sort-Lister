const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name:        { type: String },
  description: { type: String, default: '' },
  link:        { type: String, default: '' },
  techStack:   { type: String, default: '' },
});

const applicationSchema = new mongoose.Schema({
  job:            { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate:      { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateProfile', required: true },

  fullName:       { type: String, required: true },
  email:          { type: String, required: true, lowercase: true },
  phone:          { type: String, default: '' },
  currentRole:    { type: String, default: '' },
  currentCompany: { type: String, default: '' },
  experience:     { type: Number, default: 0 },
  education:      { type: String, default: '' },
  skills:         [{ type: String }],
  github:         { type: String, default: '' },
  linkedin:       { type: String, default: '' },
  portfolio:      { type: String, default: '' },
  projects:       [projectSchema],
  coverLetter:    { type: String, default: '' },
  resume:         { type: String, default: '' },
  expectedSalary: { type: Number, default: 0 },
  noticePeriod:   { type: String, default: '' },
  location:       { type: String, default: '' },

  intentData: {
    formFillTime:      { type: Number, default: 0 },
    copyPasteDetected: { type: Boolean, default: false },
    mouseMovements:    { type: Number, default: 0 },
    typingSpeed:       { type: Number, default: 0 },
    coverLetterLength: { type: Number, default: 0 },
    tabSwitches:       { type: Number, default: 0 },
    isRobotic:         { type: Boolean, default: false },
  },

  scores: {
    skillMatch:      { type: Number, default: 0 },
    experienceScore: { type: Number, default: 0 },
    githubScore:     { type: Number, default: 0 },
    linkedinScore:   { type: Number, default: 0 },
    projectScore:    { type: Number, default: 0 },
    intentScore:     { type: Number, default: 0 },
    resumeMatch:     { type: Number, default: 0 },
    finalScore:      { type: Number, default: 0 },
  },

  githubDetails:    { type: mongoose.Schema.Types.Mixed, default: {} },
  aiSummary:        { type: String, default: '' },
  aiStrengths:      [{ type: String }],
  aiWeaknesses:     [{ type: String }],
  aiRecommendation: { type: String, enum: ['top','good','average','rejected','pending'], default: 'pending' },

  status: {
    type: String,
    enum: ['applied','screening','shortlisted','interview','offered','rejected','withdrawn'],
    default: 'applied',
  },
  isShortlisted:     { type: Boolean, default: false },
  messagingDisabled: { type: Boolean, default: false },   // HR can disable candidate replies
  hrStatusVisible:   { type: Boolean, default: false },   // true only after HR takes action
  hrNotes:       { type: String, default: '' },
  aiAnalyzedAt:  { type: Date },
}, { timestamps: true });

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
