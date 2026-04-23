require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const CandidateProfile = require('./models/CandidateProfile');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Message = require('./models/Message');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-intent-review');
  console.log('✅ Connected to MongoDB');

  // WIPE EVERYTHING
  // Wipe all data fresh
  await Promise.all([
    User.deleteMany({}),
    CandidateProfile.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Message.deleteMany({}),
  ]);
  console.log('🗑️  Database cleared');

  // HR Demo Account
  const hr = await User.create({
    name: 'Priya Sharma',
    email: 'hr@demo.com',
    password: 'demo123',
    company: 'TechCorp India Pvt Ltd',
    role: 'hr',
  });
  console.log('✅ HR: hr@demo.com / demo123');

  // Candidate Demo Account
  const candidate = await CandidateProfile.create({
    name: 'Rahul Kumar',
    email: 'candidate@demo.com',
    password: 'demo123',
    phone: '+91 9876543210',
    location: 'Delhi, India',
    bio: 'Passionate full-stack developer with 2+ years of experience building scalable web applications.',
    currentRole: 'Frontend Developer',
    currentCompany: 'StartupXYZ',
    experience: 2,
    education: 'B.Tech Computer Science, Delhi University, 2022',
    skills: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'TypeScript'],
    github: 'https://github.com/torvalds',
    linkedin: 'https://linkedin.com/in/rahulkumar',
    portfolio: 'https://rahulkumar.dev',
    expectedSalary: 800000,
    noticePeriod: '30 days',
    projects: [
      {
        name: 'E-Commerce Platform',
        description: 'Full-stack MERN e-commerce with payment gateway',
        link: 'https://github.com/torvalds/linux',
        techStack: 'React, Node.js, MongoDB, Stripe',
      },
      {
        name: 'AI Chat Application',
        description: 'Real-time chat with OpenAI integration',
        link: 'https://github.com/torvalds/linux',
        techStack: 'React, Socket.io, OpenAI API',
      },
    ],
  });
  console.log('✅ Candidate: candidate@demo.com / demo123');

  // Create demo jobs
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 30);

  const jobs = await Job.create([
    {
      title: 'Senior React Developer',
      company: 'TechCorp India',
      description: 'We are looking for a skilled React developer to join our growing team. You will build scalable frontend applications and work with a modern tech stack.',
      requirements: '3+ years React experience, TypeScript knowledge, experience with REST APIs',
      responsibilities: 'Build and maintain React applications, code reviews, mentor junior developers',
      skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
      experienceMin: 2, experienceMax: 6,
      salaryMin: 800000, salaryMax: 1500000, salaryVisible: true,
      location: 'Delhi (Hybrid)', jobType: 'Full-time', workMode: 'Hybrid',
      category: 'Technology', openings: 2,
      linkExpiry: tomorrow,
      postedBy: hr._id,
    },
    {
      title: 'Python ML Engineer',
      company: 'TechCorp India',
      description: 'Join our AI team to build machine learning models and data pipelines for production systems.',
      requirements: 'Strong Python, ML frameworks (TensorFlow/PyTorch), MLOps experience',
      responsibilities: 'Design ML models, deploy to production, maintain data pipelines',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'AWS'],
      experienceMin: 1, experienceMax: 5,
      salaryMin: 700000, salaryMax: 1400000, salaryVisible: true,
      location: 'Remote', jobType: 'Full-time', workMode: 'Remote',
      category: 'Data Science', openings: 3,
      linkExpiry: tomorrow,
      postedBy: hr._id,
    },
    {
      title: 'Full Stack Developer (MERN)',
      company: 'TechCorp India',
      description: 'Build end-to-end web applications using the MERN stack. Work with cross-functional teams.',
      requirements: 'MongoDB, Express, React, Node.js, REST API design',
      skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'Express'],
      experienceMin: 0, experienceMax: 3,
      salaryMin: 400000, salaryMax: 800000, salaryVisible: true,
      location: 'Bangalore', jobType: 'Full-time', workMode: 'On-site',
      category: 'Technology', openings: 5,
      linkExpiry: tomorrow,
      postedBy: hr._id,
    },
  ]);
  console.log(`✅ ${jobs.length} demo jobs created`);

  console.log('\n🎉 Seed complete!');
  console.log('══════════════════════════════════');
  console.log('  HR Login:        hr@demo.com / demo123');
  console.log('  Candidate Login: candidate@demo.com / demo123');
  console.log('══════════════════════════════════');
  jobs.forEach(j => console.log(`  Job: "${j.title}" → Apply: http://localhost:3000/apply/${j.applicationToken}`));
  await mongoose.disconnect();
}

seed().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
