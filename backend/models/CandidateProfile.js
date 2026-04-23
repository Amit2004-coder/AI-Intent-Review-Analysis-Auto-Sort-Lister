const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  link:        { type: String, default: '' },
  techStack:   { type: String, default: '' },
  year:        { type: String, default: '' },
});

const candidateSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  password:      { type: String, required: true },
  phone:         { type: String, default: '' },
  avatar:        { type: String, default: '' },
  location:      { type: String, default: '' },
  bio:           { type: String, default: '' },
  currentRole:   { type: String, default: '' },
  currentCompany:{ type: String, default: '' },
  experience:    { type: Number, default: 0 },
  education:     { type: String, default: '' },
  skills:        [{ type: String }],
  github:        { type: String, default: '' },
  linkedin:      { type: String, default: '' },
  portfolio:     { type: String, default: '' },
  resume:        { type: String, default: '' },
  expectedSalary:{ type: Number, default: 0 },
  noticePeriod:  { type: String, default: '' },
  projects:      [projectSchema],
  isProfileComplete: { type: Boolean, default: false },
}, { timestamps: true });

candidateSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
candidateSchema.methods.comparePassword = function(pw) { return bcrypt.compare(pw, this.password); };
candidateSchema.methods.toJSON = function() { const o = this.toObject(); delete o.password; return o; };

module.exports = mongoose.model('CandidateProfile', candidateSchema);
