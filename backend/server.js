const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/jobs',         require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/user',         require('./routes/user'));
app.use('/api/messages',     require('./routes/messages'));
// Candidate routes (separate auth)
const candidateRoutes = require('./routes/candidate');
app.use('/api/candidate', candidateRoutes.router);

app.get('/api/health', (req, res) => res.json({ status: 'OK', version: '3.0' }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-intent-review')
  .then(() => {
    console.log('✅ MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ DB Error:', err.message); process.exit(1); });
