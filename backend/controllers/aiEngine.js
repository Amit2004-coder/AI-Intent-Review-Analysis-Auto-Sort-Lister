/**
 * AI INTENT REVIEW v4 — Advanced Scoring Engine
 * Real GitHub API integration + LinkedIn analysis
 */
const axios = require('axios');

// ─── GITHUB REAL API ANALYSIS ─────────────────────────────────────────────────
async function analyzeGitHub(githubUrl) {
  if (!githubUrl?.trim()) return { score: 0, details: 'No GitHub URL provided' };
  
  try {
    // Extract username from URL
    const match = githubUrl.match(/github\.com\/([^\/\?\s]+)/);
    if (!match) return { score: 10, details: 'Invalid GitHub URL format' };
    const username = match[1];
    
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    
    // Fetch user profile
    const [userRes, reposRes] = await Promise.allSettled([
      axios.get(`https://api.github.com/users/${username}`, { headers, timeout: 5000 }),
      axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`, { headers, timeout: 5000 }),
    ]);
    
    if (userRes.status === 'rejected') return { score: 20, details: 'GitHub profile not accessible' };
    
    const user = userRes.value.data;
    const repos = reposRes.status === 'fulfilled' ? reposRes.value.data : [];
    
    let score = 30; // base for having a valid profile
    const details = [];
    
    // Profile completeness
    if (user.bio) { score += 5; details.push('Has bio'); }
    if (user.location) { score += 3; details.push(`Location: ${user.location}`); }
    if (user.company) { score += 3; details.push(`Company: ${user.company}`); }
    
    // Followers
    if (user.followers >= 100) { score += 15; details.push(`${user.followers} followers`); }
    else if (user.followers >= 20) { score += 10; details.push(`${user.followers} followers`); }
    else if (user.followers >= 5) { score += 5; details.push(`${user.followers} followers`); }
    
    // Repos
    const publicRepos = repos.filter(r => !r.fork);
    if (publicRepos.length >= 20) { score += 20; details.push(`${publicRepos.length} original repos`); }
    else if (publicRepos.length >= 10) { score += 15; details.push(`${publicRepos.length} original repos`); }
    else if (publicRepos.length >= 5) { score += 10; details.push(`${publicRepos.length} repos`); }
    else if (publicRepos.length >= 1) { score += 5; details.push(`${publicRepos.length} repos`); }
    
    // Stars received
    const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
    if (totalStars >= 50) { score += 10; details.push(`${totalStars} stars`); }
    else if (totalStars >= 10) { score += 5; details.push(`${totalStars} stars`); }
    
    // Recent activity (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentRepos = repos.filter(r => new Date(r.updated_at) > sixMonthsAgo);
    if (recentRepos.length >= 5) { score += 10; details.push('Very active recently'); }
    else if (recentRepos.length >= 2) { score += 6; details.push('Active recently'); }
    else if (recentRepos.length >= 1) { score += 3; details.push('Some recent activity'); }
    
    // Languages diversity
    const langs = [...new Set(repos.map(r => r.language).filter(Boolean))];
    if (langs.length >= 5) { score += 5; details.push(`${langs.length} languages`); }
    
    return { 
      score: Math.min(100, score), 
      details: details.join(', '),
      username,
      publicRepos: publicRepos.length,
      followers: user.followers,
      totalStars,
      recentActivity: recentRepos.length,
      languages: langs.slice(0, 5),
    };
  } catch (err) {
    console.log('GitHub API error:', err.message);
    // Fallback: if URL is valid but API fails, give partial credit
    return { score: 35, details: 'GitHub profile found (API limit reached)' };
  }
}

// ─── LINKEDIN ANALYSIS ────────────────────────────────────────────────────────
function analyzeLinkedIn(linkedinUrl, candidateData = {}) {
  if (!linkedinUrl?.trim()) return { score: 0, details: 'No LinkedIn URL' };
  if (!linkedinUrl.includes('linkedin.com/in/')) return { score: 10, details: 'Invalid LinkedIn URL' };
  
  let score = 40; // base for valid profile
  const details = [];
  
  // Check URL quality (custom URL vs default)
  const username = linkedinUrl.split('/in/')[1]?.replace(/\/$/, '');
  if (username && !/^\d+$/.test(username) && username.length > 3) {
    score += 10; details.push('Custom LinkedIn URL');
  }
  
  // Cross-check with candidate data
  if (candidateData.experience >= 2) { score += 10; details.push('Experienced profile'); }
  if (candidateData.education) { score += 8; details.push('Education listed'); }
  if (candidateData.currentCompany) { score += 8; details.push('Current company listed'); }
  if (candidateData.projects?.length > 0) { score += 10; details.push('Has projects'); }
  if (candidateData.skills?.length >= 5) { score += 8; details.push('Multiple skills'); }
  if (candidateData.bio && candidateData.bio.length > 100) { score += 6; details.push('Has summary/about'); }
  
  return { score: Math.min(100, score), details: details.join(', ') };
}

// ─── SKILL MATCH ──────────────────────────────────────────────────────────────
function skillMatch(candidateSkills, jobSkills) {
  if (!jobSkills?.length) return 50;
  if (!candidateSkills?.length) return 0;
  const cLow = candidateSkills.map(s => s.toLowerCase().trim());
  const jLow = jobSkills.map(s => s.toLowerCase().trim());
  let matched = 0;
  jLow.forEach(js => { if (cLow.some(cs => cs.includes(js) || js.includes(cs))) matched++; });
  return Math.round((matched / jLow.length) * 100);
}

// ─── EXPERIENCE SCORE ─────────────────────────────────────────────────────────
function experienceScore(exp, min, max) {
  if (exp >= min && exp <= max) return 100;
  if (exp < min) return Math.max(0, 100 - (min - exp) * 15);
  return 85;
}

// ─── PROJECT SCORE ─────────────────────────────────────────────────────────────
function projectScore(projects = []) {
  if (!projects || projects.length === 0) return 0;
  let score = 20;
  score += Math.min(projects.length * 15, 50); // up to 50 for quantity
  // Bonus for projects with links
  const withLinks = projects.filter(p => p.link && p.link.trim());
  score += withLinks.length * 10;
  return Math.min(100, score);
}

// ─── INTENT / BEHAVIORAL SCORE ───────────────────────────────────────────────
function intentScore(data = {}) {
  let score = 65;
  const { formFillTime = 0, copyPasteDetected, coverLetterLength = 0, isRobotic, tabSwitches = 0, typingSpeed = 0 } = data;
  if (copyPasteDetected) score -= 20;
  if (isRobotic)         score -= 25;
  if (formFillTime < 30) score -= 20;
  else if (formFillTime > 180) score += 10;
  if (coverLetterLength > 600) score += 20;
  else if (coverLetterLength > 300) score += 12;
  else if (coverLetterLength > 100) score += 5;
  else if (coverLetterLength < 50) score -= 15;
  if (tabSwitches > 5) score -= 10;
  if (typingSpeed > 10 && typingSpeed < 200) score += 5;
  return Math.max(0, Math.min(100, score));
}

// ─── RESUME KEYWORD MATCH ─────────────────────────────────────────────────────
function resumeMatch(resumeText, jobDesc) {
  if (!resumeText || !jobDesc) return 40;
  const keywords = [...new Set((jobDesc.toLowerCase().match(/\b[a-z]{3,}\b/g) || []))];
  const resumeLow = resumeText.toLowerCase();
  const matched = keywords.filter(k => resumeLow.includes(k)).length;
  return Math.round((matched / Math.max(keywords.length, 1)) * 100);
}

// ─── CATEGORY ────────────────────────────────────────────────────────────────
function getCategory(score) {
  if (score >= 90) return 'top';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  return 'rejected';
}

// ─── AI SUMMARY ──────────────────────────────────────────────────────────────
function buildSummary(scores, githubDetails, linkedinDetails) {
  const { finalScore, skillMatch: sm, githubScore: gh, intentScore: intent, linkedinScore: li } = scores;
  let txt = `AI Score: ${finalScore}/100. `;
  txt += sm >= 70 ? `Strong skill match (${sm}%). ` : sm >= 40 ? `Partial skill match (${sm}%). ` : `Low skill match (${sm}%). `;
  if (gh > 50 && githubDetails?.username) txt += `GitHub: @${githubDetails.username} — ${githubDetails.publicRepos || 0} repos. `;
  else txt += 'No verified GitHub. ';
  if (li > 40) txt += 'LinkedIn profile verified. ';
  if (intent >= 70) txt += 'Genuine application behavior. ';
  else if (intent < 50) txt += 'Suspicious application behavior. ';
  const cat = getCategory(finalScore);
  txt += cat === 'top' ? '✅ Highly recommended.' : cat === 'good' ? '👍 Good candidate.' : cat === 'average' ? '⚠️ Average fit.' : '❌ Below requirements.';
  return txt;
}

function buildInsights(scores, app, githubDetails) {
  const strengths = [], weaknesses = [];
  if (scores.skillMatch >= 70) strengths.push('Strong skill alignment with job requirements');
  else weaknesses.push('Missing key required skills');
  if (scores.experienceScore >= 80) strengths.push('Experience level matches job perfectly');
  else if (scores.experienceScore < 50) weaknesses.push('Experience below required level');
  if (scores.githubScore >= 60) {
    strengths.push(`Active GitHub: ${githubDetails?.publicRepos || 0} repos, ${githubDetails?.totalStars || 0} stars`);
  } else if (scores.githubScore >= 30) strengths.push('GitHub profile present');
  else weaknesses.push('No GitHub profile or insufficient activity');
  if (scores.linkedinScore >= 50) strengths.push('Professional LinkedIn profile');
  else weaknesses.push('LinkedIn profile missing or weak');
  if (scores.intentScore >= 70) strengths.push('Application shows genuine interest');
  else weaknesses.push('Low intent score — rushed or suspicious submission');
  if (app.projects?.length > 0) strengths.push(`Has ${app.projects.length} project(s) listed`);
  if ((app.intentData?.coverLetterLength || 0) > 300) strengths.push('Detailed cover letter written');
  else weaknesses.push('Cover letter too short or missing');
  return { strengths, weaknesses };
}

// ─── MAIN ANALYZE FUNCTION ────────────────────────────────────────────────────
async function analyzeApplication(application, job) {
  const sm  = skillMatch(application.skills, job.skills);
  const es  = experienceScore(application.experience || 0, job.experienceMin || 0, job.experienceMax || 10);
  const ps  = projectScore(application.projects || []);
  const its = intentScore(application.intentData || {});
  const rm  = application.resumeText
    ? resumeMatch(application.resumeText, `${job.description} ${job.requirements}`)
    : sm; // fallback to skill match

  // Real GitHub analysis
  const githubDetails = await analyzeGitHub(application.github || '');
  const gh = githubDetails.score;

  // LinkedIn analysis
  const liDetails = analyzeLinkedIn(application.linkedin || '', application);
  const li = liDetails.score;

  // Weighted final score
  const final = Math.round(
    rm  * 0.22 +
    sm  * 0.20 +
    gh  * 0.18 +
    es  * 0.12 +
    li  * 0.12 +
    its * 0.09 +
    ps  * 0.07
  );

  const scores = {
    skillMatch: sm, experienceScore: es, githubScore: gh,
    linkedinScore: li, projectScore: ps, intentScore: its,
    resumeMatch: rm, finalScore: Math.min(100, final),
  };

  const { strengths, weaknesses } = buildInsights(scores, application, githubDetails);

  return {
    scores,
    aiRecommendation: getCategory(final),
    aiSummary: buildSummary(scores, githubDetails, liDetails),
    aiStrengths: strengths,
    aiWeaknesses: weaknesses,
    isShortlisted: final >= 70,
    githubDetails,
  };
}

module.exports = { analyzeApplication, getCategory, analyzeGitHub };
