import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ScoreRing from '../components/ScoreRing';

const STATI = ['screening', 'shortlisted', 'interview', 'offered', 'rejected'];
const SC = { screening: '#7b8fc3', shortlisted: '#22c55e', interview: '#06b6d4', offered: '#eab308', rejected: '#ef4444', applied: '#4a5a7a' };
const API = 'http://localhost:5000';

export default function JobStatus() {
  const { jobId } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState(null);

  const load = async () => {
    try {
      const { data: res } = await axios.get(`/api/applications/job-status/${jobId}`);
      setData(res);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [jobId]);

  const updateStatus = async (appId, status) => {
    try {
      await axios.put(`/api/applications/${appId}/status`, { status });
      setData(d => ({
        ...d,
        applications: d.applications.map(a => a._id === appId ? { ...a, status, hrStatusVisible: true, isShortlisted: ['shortlisted', 'interview', 'offered'].includes(status) } : a),
      }));
      if (sel?._id === appId) setSel(s => ({ ...s, status }));
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
  };

  if (loading) return <Loader />;
  if (!data) return null;

  const { job, stats, applications } = data;
  const filtered = filter === 'all' ? applications : applications.filter(a => {
    if (filter === 'shortlisted') return ['shortlisted', 'interview', 'offered'].includes(a.status);
    if (filter === 'pending') return ['applied', 'screening'].includes(a.status);
    return a.aiRecommendation === filter || a.status === filter;
  });

  const scoreColor = s => s >= 75 ? 'var(--green)' : s >= 50 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {/* Back */}
        <button onClick={() => nav('/hr')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '.82rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
          ← Back to Dashboard
        </button>

        {/* Job Header */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '.25rem' }}>{job.title}</h1>
              <p style={{ color: 'var(--text2)', fontSize: '.84rem' }}>{job.company} · {job.location} · {job.jobType} · {job.workMode}</p>
              <p style={{ color: 'var(--text2)', fontSize: '.78rem', marginTop: '.3rem' }}>
                Exp: {job.experienceMin}–{job.experienceMax} yrs
                {job.salaryVisible && job.salaryMax > 0 ? ` · ₹${(job.salaryMin / 100000).toFixed(1)}–${(job.salaryMax / 100000).toFixed(1)} LPA` : ''}
              </p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/apply/${job.applicationToken}`); toast.success('Link copied!'); }} className="btn btn-ghost btn-sm">
              📋 Copy Apply Link
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '.75rem', marginBottom: '1.5rem' }}>
          {[
            { l: 'Total Applied', v: stats.total, c: '#3b82f6', f: 'all' },
            { l: '⭐ Top (AI)', v: stats.top, c: '#22c55e', f: 'top' },
            { l: '👍 Good (AI)', v: stats.good, c: '#60a5fa', f: 'good' },
            { l: 'Shortlisted', v: stats.shortlisted, c: '#22c55e', f: 'shortlisted' },
            { l: 'Interview', v: stats.interview, c: '#06b6d4', f: 'interview' },
            { l: 'Rejected', v: stats.rejected, c: '#ef4444', f: 'rejected' },
            { l: 'Pending', v: stats.pending, c: '#7b8fc3', f: 'pending' },
            { l: 'Avg Score', v: `${stats.avgScore}%`, c: '#eab308', f: null },
          ].map((s, i) => (
            <div key={i} onClick={() => s.f && setFilter(f => f === s.f ? 'all' : s.f)}
              className="card" style={{ padding: '.9rem 1rem', cursor: s.f ? 'pointer' : 'default', border: filter === s.f ? '1px solid var(--accent)' : '1px solid var(--border)', background: filter === s.f ? 'var(--card2)' : 'var(--card)' }}>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: s.c, fontFamily: 'Bricolage Grotesque', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: '.73rem', color: 'var(--text2)', marginTop: '.25rem', fontWeight: 500 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Active filter indicator */}
        {filter !== 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '.78rem', color: 'var(--text2)' }}>Showing: <strong style={{ color: 'var(--accent)' }}>{filter}</strong> ({filtered.length})</span>
            <button onClick={() => setFilter('all')} className="btn btn-ghost btn-sm">✕ Clear Filter</button>
          </div>
        )}

        {/* Candidates Table */}
        <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 380px' : '1fr', gap: '1rem', alignItems: 'start' }}>
          <div>
            {filtered.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text2)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h3 style={{ color: 'var(--text)', marginBottom: '.5rem' }}>No candidates in this filter</h3>
              </div>
            ) : filtered.map((app, idx) => {
              const fs = app.scores?.finalScore || 0;
              return (
                <div key={app._id} onClick={() => setSel(sel?._id === app._id ? null : app)}
                  className="card" style={{ padding: '1rem 1.2rem', marginBottom: '.6rem', cursor: 'pointer', border: sel?._id === app._id ? '1px solid var(--accent)' : '1px solid var(--border)', transition: 'all .15s' }}>
                  <div style={{ display: 'flex', gap: '.9rem', alignItems: 'center' }}>
                    {/* Rank */}
                    <div style={{ width: 26, flexShrink: 0, textAlign: 'center' }}>
                      <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 700 }}>#{idx + 1}</div>
                    </div>

                    {/* Score Ring */}
                    <ScoreRing score={fs} size={52} thick={5} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.3rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '.9rem' }}>{app.fullName}</div>
                          <div style={{ color: 'var(--text2)', fontSize: '.74rem' }}>{app.email}</div>
                          {app.currentRole && <div style={{ color: '#60a5fa', fontSize: '.72rem', fontWeight: 600 }}>{app.currentRole}{app.currentCompany ? ` @ ${app.currentCompany}` : ''}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`badge badge-${app.aiRecommendation || 'pending'}`}>
                            {app.aiRecommendation === 'top' ? '⭐ Top' : app.aiRecommendation === 'good' ? '👍 Good' : app.aiRecommendation === 'average' ? '📊 Avg' : app.aiRecommendation === 'rejected' ? '❌ Low' : '⏳'}
                          </span>
                          <select value={app.status || 'screening'} onChange={e => { e.stopPropagation(); updateStatus(app._id, e.target.value); }} onClick={e => e.stopPropagation()}
                            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: SC[app.status] || 'var(--text2)', borderRadius: 6, padding: '.2rem .45rem', fontSize: '.7rem', fontWeight: 700, cursor: 'pointer' }}>
                            {STATI.map(st => <option key={st} value={st} style={{ color: 'var(--text)' }}>{st}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Score bars */}
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {[['Skills', app.scores?.skillMatch], ['Resume', app.scores?.resumeMatch], ['GitHub', app.scores?.githubScore], ['LinkedIn', app.scores?.linkedinScore], ['Intent', app.scores?.intentScore]].map(([lb, sc]) => (
                          <div key={lb} style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                            <span style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{lb}</span>
                            <span style={{ fontSize: '.72rem', fontWeight: 800, color: scoreColor(sc || 0) }}>{sc || 0}%</span>
                          </div>
                        ))}
                        {app.experience > 0 && <div style={{ fontSize: '.7rem', color: 'var(--text2)' }}>{app.experience}yr</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          {sel && (
            <div style={{ position: 'sticky', top: 80 }}>
              <div className="card" style={{ padding: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '.95rem' }}>Candidate Detail</h3>
                  <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}>×</button>
                </div>

                {/* Avatar + name */}
                <div style={{ textAlign: 'center', marginBottom: '1.1rem' }}>
                  {sel.candidate?.avatar
                    ? <img src={`${API}${sel.candidate.avatar}`} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', margin: '0 auto .7rem', display: 'block' }} />
                    : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', color: '#fff', margin: '0 auto .7rem' }}>{sel.fullName?.[0]?.toUpperCase()}</div>
                  }
                  <ScoreRing score={sel.scores?.finalScore || 0} size={80} label="Final Score" />
                  <div style={{ fontWeight: 800, fontSize: '.98rem', marginTop: '.7rem' }}>{sel.fullName}</div>
                  <div style={{ color: 'var(--text2)', fontSize: '.76rem' }}>{sel.email}</div>
                  {sel.currentRole && <div style={{ fontSize: '.78rem', color: '#60a5fa', fontWeight: 600, marginTop: '.2rem' }}>{sel.currentRole}</div>}
                </div>

                {/* Score breakdown */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.55rem' }}>Score Breakdown</div>
                  {[['🛠 Skills', sel.scores?.skillMatch], ['📄 Resume', sel.scores?.resumeMatch], ['🐙 GitHub', sel.scores?.githubScore], ['💼 LinkedIn', sel.scores?.linkedinScore], ['⏳ Experience', sel.scores?.experienceScore], ['🧠 Intent', sel.scores?.intentScore]].map(([lb, sc]) => {
                    const v = sc || 0; const col = scoreColor(v);
                    return (
                      <div key={lb} style={{ marginBottom: '.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: '.18rem' }}>
                          <span style={{ color: 'var(--text2)' }}>{lb}</span>
                          <span style={{ fontWeight: 800, color: col }}>{v}%</span>
                        </div>
                        <div className="pbar"><div className="pfill" style={{ width: `${v}%`, background: col }} /></div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Summary */}
                {sel.aiSummary && (
                  <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: 8, padding: '.85rem', marginBottom: '.9rem' }}>
                    <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#60a5fa', marginBottom: '.3rem', textTransform: 'uppercase' }}>🤖 AI Summary</div>
                    <p style={{ fontSize: '.76rem', color: 'var(--text2)', lineHeight: 1.65 }}>{sel.aiSummary}</p>
                  </div>
                )}

                {/* Strengths & Gaps */}
                {(sel.aiStrengths?.length > 0 || sel.aiWeaknesses?.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem', marginBottom: '.9rem' }}>
                    {sel.aiStrengths?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--green)', marginBottom: '.35rem', textTransform: 'uppercase' }}>✓ Strengths</div>
                        {sel.aiStrengths.map((s, i) => <div key={i} style={{ fontSize: '.7rem', color: 'var(--text2)', marginBottom: '.2rem', lineHeight: 1.4 }}>• {s}</div>)}
                      </div>
                    )}
                    {sel.aiWeaknesses?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--red)', marginBottom: '.35rem', textTransform: 'uppercase' }}>⚠ Gaps</div>
                        {sel.aiWeaknesses.map((w, i) => <div key={i} style={{ fontSize: '.7rem', color: 'var(--text2)', marginBottom: '.2rem', lineHeight: 1.4 }}>• {w}</div>)}
                      </div>
                    )}
                  </div>
                )}

                {/* Info */}
                <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '.8rem', marginBottom: '.9rem' }}>
                  {[['Exp', sel.experience ? `${sel.experience} yrs` : '—'], ['Education', sel.education || '—'], ['Location', sel.location || '—'], ['Salary', sel.expectedSalary ? `₹${Number(sel.expectedSalary).toLocaleString()}` : '—'], ['Notice', sel.noticePeriod || '—']].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '.28rem 0', borderBottom: '1px solid var(--border)', fontSize: '.73rem' }}>
                      <span style={{ color: 'var(--text2)' }}>{k}</span>
                      <span style={{ fontWeight: 700, maxWidth: '55%', textAlign: 'right' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Links */}
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.9rem' }}>
                  {sel.github && <a href={sel.github} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🐙 GitHub</a>}
                  {sel.linkedin && <a href={sel.linkedin} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">💼 LinkedIn</a>}
                  {sel.resume && <a href={`${API}${sel.resume}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">📄 Resume</a>}
                </div>

                {/* Update status */}
                <div className="fg" style={{ marginBottom: '.75rem' }}>
                  <label>Update Status</label>
                  <select value={sel.status || 'screening'} onChange={e => updateStatus(sel._id, e.target.value)} style={{ color: SC[sel.status] || 'var(--text)', fontWeight: 700 }}>
                    {STATI.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
                  </select>
                </div>

                {/* Go to full applicants view */}
                <button onClick={() => nav(`/hr/job/${jobId}/applicants`)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                  View Full Applicants Page →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Loader = () => <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spin" style={{ width: 40, height: 40 }} /></div>;
