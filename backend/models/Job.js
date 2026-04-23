const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const jobSchema = new mongoose.Schema({
  // Basic Info
  title:           { type: String, required: true, trim: true },
  company:         { type: String, required: true },
  description:     { type: String, required: true },
  requirements:    { type: String, default: '' },
  responsibilities:{ type: String, default: '' },

  // Requirements
  skills:          [{ type: String }],
  experienceMin:   { type: Number, default: 0 },
  experienceMax:   { type: Number, default: 10 },
  salaryMin:       { type: Number, default: 0 },
  salaryMax:       { type: Number, default: 0 },
  salaryVisible:   { type: Boolean, default: true },
  location:        { type: String, default: 'Remote' },
  jobType:         { type: String, enum: ['Full-time','Part-time','Contract','Internship','Freelance'], default: 'Full-time' },
  workMode:        { type: String, enum: ['Remote','On-site','Hybrid'], default: 'Remote' },
  openings:        { type: Number, default: 1 },
  category:        { type: String, default: 'Technology' },

  // Unique application link
  applicationToken: { type: String, unique: true },  // UUID token
  linkExpiry:       { type: Date, required: true },   // HR sets expiry
  isActive:         { type: Boolean, default: true },

  postedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalApplications:{ type: Number, default: 0 },
  views:            { type: Number, default: 0 },
}, { timestamps: true });

// Auto generate unique token before save
jobSchema.pre('save', function (next) {
  if (!this.applicationToken) {
    this.applicationToken = uuidv4();
  }
  next();
});

// Virtual: is link still valid?
jobSchema.virtual('isLinkValid').get(function () {
  return this.isActive && this.linkExpiry > new Date();
});

module.exports = mongoose.model('Job', jobSchema);
