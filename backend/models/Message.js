const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  application:      { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  job:              { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  senderRole:       { type: String, enum: ['hr','candidate'], required: true },
  senderName:       { type: String, required: true },
  text:             { type: String, required: true, trim: true },
  isRead:           { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
