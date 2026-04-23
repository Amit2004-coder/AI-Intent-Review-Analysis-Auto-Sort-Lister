import React,{useState,useEffect} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';
import ScoreRing from '../components/ScoreRing';
import {formatDistanceToNow} from 'date-fns';

const API='http://localhost:5000';

// Status shown to candidate (friendly labels — no AI scores)
const statusLabel = s => ({
  applied:    '📋 Submitted',
  screening:  '🔍 Under Review',
  shortlisted:'⭐ Shortlisted',
  interview:  '🎤 Interview Scheduled',
  offered:    '🎁 Offer Received',
  rejected:   '❌ Not Selected',
  withdrawn:  '↩️ Withdrawn',
}[s] || '📋 Submitted');

const statusBg = s => ({
  shortlisted:'rgba(34,197,94,.12)',interview:'rgba(6,182,212,.12)',offered:'rgba(234,179,8,.12)',rejected:'rgba(239,68,68,.12)',
}[s] || 'rgba(123,143,195,.08)');

const statusColor = s => ({
  shortlisted:'#22c55e',interview:'#06b6d4',offered:'#eab308',rejected:'#ef4444',
}[s] || '#7b8fc3');

export default function CandidateDash(){
  const {candidate}=useAuth();
  const nav=useNavigate();
  const [apps,setApps]=useState([]);
  const [jobs,setJobs]=useState([]);
  const [totalJobs,setTotalJobs]=useState(0);
  const [loadingApps,setLoadingApps]=useState(true);
  const [loadingJobs,setLoadingJobs]=useState(true);
  const [selApp,setSelApp]=useState(null);
  const [msgs,setMsgs]=useState([]);
  const [newMsg,setNewMsg]=useState('');
  const [msgDisabled,setMsgDisabled]=useState(false);
  const [activeTab,setActiveTab]=useState('jobs');

  // Job search state
  const [search,setSearch]=useState('');
  const [skillFilter,setSkillFilter]=useState('');
  const [locationFilter,setLocationFilter]=useState('');
  const [jobTypeFilter,setJobTypeFilter]=useState('');
  const [workModeFilter,setWorkModeFilter]=useState('');
  const [page,setPage]=useState(1);
  const [totalPages,setTotalPages]=useState(1);

  useEffect(()=>{
    axios.get('/api/applications/candidate/mine')
      .then(r=>setApps(r.data.applications||[]))
      .finally(()=>setLoadingApps(false));
  },[]);

  useEffect(()=>{
    setLoadingJobs(true);
    axios.get('/api/candidate/jobs',{params:{search,skills:skillFilter,location:locationFilter,jobType:jobTypeFilter,workMode:workModeFilter,page,limit:9}})
      .then(r=>{setJobs(r.data.jobs||[]);setTotalJobs(r.data.total||0);setTotalPages(r.data.pages||1);})
      .finally(()=>setLoadingJobs(false));
  },[search,skillFilter,locationFilter,jobTypeFilter,workModeFilter,page]);

  const loadMsgs=async appId=>{
    const {data}=await axios.get('/api/messages/'+appId);
    setMsgs(data.messages||[]);
    setMsgDisabled(data.messagingDisabled||false);
  };

  const openApp=app=>{
    setSelApp(app);
    loadMsgs(app._id);
    setActiveTab('applications');
  };

  const sendMsg=async()=>{
    if(!newMsg.trim()||!selApp)return;
    try{
      await axios.post('/api/messages/candidate',{applicationId:selApp._id,text:newMsg.trim()});
      setNewMsg('');
      loadMsgs(selApp._id);
    }catch(e){
      const msg=e.response?.data?.message||'Failed to send';
      alert(msg);
      if(e.response?.data?.messagingDisabled) setMsgDisabled(true);
    }
  };

  const avatarSrc=candidate?.avatar?`${API}${candidate.avatar}`:null;

  const pct=()=>{
    const f=['phone','bio','skills','github','linkedin','resume','currentRole','education'];
    const done=f.filter(k=>{const v=candidate?.[k];return v&&(Array.isArray(v)?v.length>0:v!=='');}).length;
    return Math.round((done/f.length)*100);
  };
  const cp=pct();

  // Stats — use HR-set status (server sanitises isShortlisted/status)
  const stats={
    total:apps.length,
    shortlisted:apps.filter(a=>a.status==='shortlisted'||a.status==='interview'||a.status==='offered').length,
    interview:apps.filter(a=>a.status==='interview').length,
    offered:apps.filter(a=>a.status==='offered').length,
  };

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div className="container" style={{padding:'2rem 1.5rem'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.75rem',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <h1 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'.2rem'}}>Hey, {candidate?.name?.split(' ')[0]} 👋</h1>
            <p style={{color:'var(--text2)',fontSize:'.85rem'}}>Browse jobs and track your applications</p>
          </div>
          <div style={{display:'flex',gap:'.5rem'}}>
            <Link to="/candidate/inbox" className="btn btn-ghost btn-sm">💬 Inbox</Link>
            <Link to="/candidate/profile" className="btn btn-ghost btn-sm">✏️ Profile</Link>
          </div>
        </div>

        {/* Clickable Stats */}
        <div className="g4" style={{marginBottom:'1.75rem'}}>
          {[
            {l:'Total Applied',v:stats.total,icon:'📋',c:'#3b82f6',tab:'applications'},
            {l:'Shortlisted',v:stats.shortlisted,icon:'⭐',c:'#22c55e',tab:'applications'},
            {l:'Interviews',v:stats.interview,icon:'🎤',c:'#06b6d4',tab:'applications'},
            {l:'Offers',v:stats.offered,icon:'🎁',c:'#eab308',tab:'applications'},
          ].map((s,i)=>(
            <div key={i} className="card" style={{cursor:'pointer',position:'relative',overflow:'hidden',padding:'1.1rem'}}
              onClick={()=>setActiveTab(s.tab)}>
              <div style={{position:'absolute',top:'-8px',right:'-8px',fontSize:'2.5rem',opacity:.07}}>{s.icon}</div>
              <div style={{fontSize:'2rem',fontWeight:800,color:s.c,fontFamily:'Bricolage Grotesque',lineHeight:1}}>{s.v}</div>
              <div style={{fontWeight:700,fontSize:'.82rem',marginTop:'.3rem'}}>{s.l}</div>
              <div style={{fontSize:'.68rem',color:'var(--text3)',marginTop:'.1rem'}}>Click to view</div>
            </div>
          ))}
        </div>

        {/* Tab Switcher */}
        <div style={{display:'flex',background:'var(--card)',borderRadius:10,padding:3,border:'1px solid var(--border)',marginBottom:'1.5rem',maxWidth:440}}>
          {[
            {id:'jobs',l:'🔍 Browse Jobs ('+totalJobs+')'},
            {id:'applications',l:'📋 My Applications ('+apps.length+')'},
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
              flex:1,padding:'.52rem .5rem',borderRadius:8,border:'none',cursor:'pointer',
              fontWeight:700,fontSize:'.78rem',
              background:activeTab===t.id?'var(--accent)':'transparent',
              color:activeTab===t.id?'#fff':'var(--text2)',
              transition:'all .18s',
            }}>{t.l}</button>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'1.5rem',alignItems:'start'}}>
          {/* Main content */}
          <div>

            {/* ── JOBS TAB ── */}
            {activeTab==='jobs'&&(
              <div>
                {/* Filters */}
                <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search jobs, companies..." style={{flex:1,minWidth:180,padding:'.5rem .9rem',fontSize:'.82rem'}}/>
                  <input value={skillFilter} onChange={e=>setSkillFilter(e.target.value)} placeholder="Skill..." style={{width:110,padding:'.5rem .8rem',fontSize:'.82rem'}}/>
                  <input value={locationFilter} onChange={e=>setLocationFilter(e.target.value)} placeholder="Location..." style={{width:120,padding:'.5rem .8rem',fontSize:'.82rem'}}/>
                  <select value={jobTypeFilter} onChange={e=>setJobTypeFilter(e.target.value)} style={{width:130,padding:'.5rem .8rem',fontSize:'.82rem'}}>
                    <option value="">All Types</option>
                    {['Full-time','Part-time','Contract','Internship','Freelance'].map(t=><option key={t}>{t}</option>)}
                  </select>
                  <select value={workModeFilter} onChange={e=>setWorkModeFilter(e.target.value)} style={{width:120,padding:'.5rem .8rem',fontSize:'.82rem'}}>
                    <option value="">All Modes</option>
                    {['Remote','On-site','Hybrid'].map(m=><option key={m}>{m}</option>)}
                  </select>
                  {(search||skillFilter||locationFilter||jobTypeFilter||workModeFilter)&&(
                    <button onClick={()=>{setSearch('');setSkillFilter('');setLocationFilter('');setJobTypeFilter('');setWorkModeFilter('');setPage(1);}} className="btn btn-ghost btn-sm">✕ Clear</button>
                  )}
                </div>

                {loadingJobs?(
                  <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spin" style={{width:36,height:36}}/></div>
                ):jobs.length===0?(
                  <div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--text2)'}}>
                    <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🔍</div>
                    <h3 style={{color:'var(--text)',marginBottom:'.5rem'}}>No jobs found</h3>
                    <p style={{fontSize:'.85rem'}}>Try different filters</p>
                  </div>
                ):(
                  <>
                    <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
                      {jobs.map(job=>(
                        <div key={job._id} className="card" style={{padding:'1.1rem 1.25rem'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'1rem',flexWrap:'wrap'}}>
                            <div style={{flex:1,minWidth:200}}>
                              <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.25rem',flexWrap:'wrap'}}>
                                <h3 style={{fontWeight:800,fontSize:'.96rem'}}>{job.title}</h3>
                                {job.alreadyApplied&&(
                                  <span style={{fontSize:'.65rem',fontWeight:800,color:'var(--green)',background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.25)',padding:'.1rem .45rem',borderRadius:100}}>✓ Applied</span>
                                )}
                              </div>
                              <p style={{color:'var(--text2)',fontSize:'.78rem',marginBottom:'.5rem'}}>{job.company} · {job.location} · {job.jobType} · {job.workMode}</p>
                              <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',marginBottom:'.5rem'}}>
                                {job.experienceMin!==undefined&&<Info l="Exp" v={job.experienceMin+'-'+job.experienceMax+' yrs'}/>}
                                {job.salaryVisible&&job.salaryMax>0&&<Info l="Salary" v={'₹'+(job.salaryMin/100000).toFixed(1)+'–'+(job.salaryMax/100000).toFixed(1)+' LPA'}/>}
                                <Info l="Openings" v={job.openings}/>
                                <Info l="Applied" v={job.totalApplications||0}/>
                              </div>
                              <div style={{display:'flex',gap:'.3rem',flexWrap:'wrap'}}>
                                {job.skills?.slice(0,5).map((sk,i)=><span key={i} className="tag">{sk}</span>)}
                              </div>
                            </div>
                            <div style={{flexShrink:0}}>
                              {job.alreadyApplied?(
                                <button onClick={()=>setActiveTab('applications')} className="btn btn-ghost btn-sm">View Status →</button>
                              ):(
                                <button onClick={()=>nav('/apply/'+job.applicationToken)} className="btn btn-primary btn-sm">Apply Now →</button>
                              )}
                            </div>
                          </div>
                          <div style={{fontSize:'.69rem',color:'var(--text3)',marginTop:'.5rem'}}>
                            Posted {formatDistanceToNow(new Date(job.createdAt),{addSuffix:true})}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages>1&&(
                      <div style={{display:'flex',justifyContent:'center',gap:'.4rem',marginTop:'1.25rem'}}>
                        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn btn-ghost btn-sm">← Prev</button>
                        {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
                          <button key={p} onClick={()=>setPage(p)} className={'btn btn-sm '+(page===p?'btn-primary':'btn-ghost')}>{p}</button>
                        ))}
                        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="btn btn-ghost btn-sm">Next →</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── APPLICATIONS TAB ── */}
            {activeTab==='applications'&&(
              <div>
                {loadingApps?(
                  <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spin" style={{width:36,height:36}}/></div>
                ):apps.length===0?(
                  <div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--text2)'}}>
                    <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>📭</div>
                    <h3 style={{color:'var(--text)',marginBottom:'.5rem'}}>No applications yet</h3>
                    <p style={{marginBottom:'1rem',fontSize:'.85rem'}}>Browse jobs and click Apply Now</p>
                    <button onClick={()=>setActiveTab('jobs')} className="btn btn-primary btn-sm">Browse Jobs →</button>
                  </div>
                ):(
                  <div style={{display:'flex',flexDirection:'column',gap:'.7rem'}}>
                    {apps.map(app=>(
                      <div key={app._id} className="card"
                        style={{padding:'1rem 1.2rem',cursor:'pointer',
                          border:selApp?._id===app._id?'1px solid var(--accent)':'1px solid var(--border)',
                          transition:'all .15s'}}
                        onClick={()=>selApp?._id===app._id?setSelApp(null):openApp(app)}>

                        <div style={{display:'flex',gap:'1rem',alignItems:'center'}}>
                          {/* Status icon instead of score ring */}
                          <div style={{width:50,height:50,borderRadius:12,
                            background: app.status==='shortlisted'||app.status==='interview'||app.status==='offered'
                              ?'rgba(34,197,94,.1)':app.status==='rejected'?'rgba(239,68,68,.1)':'rgba(59,130,246,.08)',
                            border:'1px solid '+(app.status==='shortlisted'||app.status==='interview'||app.status==='offered'
                              ?'rgba(34,197,94,.25)':app.status==='rejected'?'rgba(239,68,68,.25)':'rgba(59,130,246,.15)'),
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0}}>
                            {app.status==='shortlisted'||app.status==='interview'?'⭐':app.status==='offered'?'🎁':app.status==='rejected'?'❌':'📋'}
                          </div>

                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'.4rem',marginBottom:'.25rem'}}>
                              <div>
                                <div style={{fontWeight:800,fontSize:'.92rem'}}>{app.job?.title}</div>
                                <div style={{color:'var(--text2)',fontSize:'.74rem'}}>{app.job?.company} · {app.job?.location}</div>
                              </div>
                              {/* Show friendly status label — no AI score */}
                              <span style={{
                                fontSize:'.72rem',fontWeight:700,
                                color:statusColor(app.status),
                                background:statusBg(app.status),
                                border:'1px solid '+(app.status==='shortlisted'||app.status==='interview'||app.status==='offered'?'rgba(34,197,94,.25)':app.status==='rejected'?'rgba(239,68,68,.25)':'var(--border)'),
                                padding:'.18rem .6rem',borderRadius:100,
                              }}>
                                {statusLabel(app.status)}
                              </span>
                            </div>
                            <div style={{fontSize:'.72rem',color:'var(--text3)'}}>
                              Applied {formatDistanceToNow(new Date(app.createdAt),{addSuffix:true})}
                            </div>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {selApp?._id===app._id&&(
                          <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--border)'}}>

                            {/* Job details */}
                            <div style={{marginBottom:'1rem'}}>
                              <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--text2)',marginBottom:'.5rem',textTransform:'uppercase'}}>Job Details</div>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.4rem'}}>
                                {[['Type',app.job?.jobType],['Mode',app.job?.workMode]].map(([k,v])=>v&&(
                                  <div key={k} style={{fontSize:'.74rem'}}>
                                    <span style={{color:'var(--text3)',fontWeight:600}}>{k}: </span>
                                    <span>{v}</span>
                                  </div>
                                ))}
                              </div>
                              <div style={{marginTop:'.6rem',padding:'.6rem .75rem',background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.15)',borderRadius:8,fontSize:'.74rem',color:'var(--text2)'}}>
                                🔒 Your AI evaluation score is private. HR will contact you if you're shortlisted.
                              </div>
                            </div>

                            {/* HR Messages section */}
                            {msgs.length>0?(
                              <div style={{marginBottom:'1rem'}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.5rem'}}>
                                  <div style={{fontSize:'.7rem',fontWeight:700,color:'#60a5fa',textTransform:'uppercase'}}>💬 Messages from HR</div>
                                  <Link to="/candidate/inbox" style={{fontSize:'.7rem',color:'var(--accent)'}}>Open Inbox →</Link>
                                </div>
                                <div style={{maxHeight:140,overflowY:'auto',display:'flex',flexDirection:'column',gap:'.4rem'}}>
                                  {msgs.slice(-3).map(m=>(
                                    <div key={m._id} style={{display:'flex',flexDirection:'column',alignItems:m.senderRole==='hr'?'flex-start':'flex-end'}}>
                                      <div style={{maxWidth:'85%',padding:'.5rem .75rem',borderRadius:8,
                                        background:m.senderRole==='hr'?'rgba(59,130,246,.1)':'var(--card2)',
                                        fontSize:'.76rem',
                                        border:'1px solid '+(m.senderRole==='hr'?'rgba(59,130,246,.2)':'var(--border)')}}>
                                        <div style={{fontSize:'.6rem',color:'var(--text3)',marginBottom:'.15rem'}}>{m.senderName}</div>
                                        {m.text}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {!msgDisabled&&(
                                  <div style={{display:'flex',gap:'.4rem',marginTop:'.6rem'}}>
                                    <input value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                                      onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();sendMsg();}}}
                                      placeholder="Reply to HR..." style={{flex:1,padding:'.5rem .8rem',fontSize:'.78rem'}}/>
                                    <button onClick={sendMsg} className="btn btn-primary btn-sm">Send</button>
                                  </div>
                                )}
                                {msgDisabled&&(
                                  <div style={{marginTop:'.5rem',padding:'.5rem .75rem',background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.2)',borderRadius:7,fontSize:'.73rem',color:'var(--red)'}}>
                                    🔇 HR has disabled replies for this application
                                  </div>
                                )}
                              </div>
                            ):(
                              <div style={{padding:'.65rem .8rem',background:'var(--bg2)',borderRadius:8,fontSize:'.76rem',color:'var(--text2)'}}>
                                No messages yet. HR will message you here if they want to connect.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {/* Profile card */}
            <div className="card" style={{padding:'1.2rem',textAlign:'center'}}>
              {avatarSrc
                ?<img src={avatarSrc} alt="" style={{width:68,height:68,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--border)',margin:'0 auto .7rem',display:'block'}}/>
                :<div style={{width:68,height:68,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1.5rem',color:'#fff',margin:'0 auto .7rem'}}>{candidate?.name?.[0]?.toUpperCase()}</div>
              }
              <div style={{fontWeight:800,fontSize:'.95rem',marginBottom:'.2rem'}}>{candidate?.name}</div>
              <div style={{color:'var(--text2)',fontSize:'.74rem',marginBottom:'.7rem'}}>{candidate?.currentRole||'Add your role →'}</div>
              <div style={{marginBottom:'.7rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'.7rem',marginBottom:'.3rem'}}>
                  <span style={{color:'var(--text2)',fontWeight:600}}>Profile Strength</span>
                  <span style={{fontWeight:800,color:cp>=80?'var(--green)':cp>=50?'var(--yellow)':'var(--red)'}}>{cp}%</span>
                </div>
                <div className="pbar" style={{height:5}}>
                  <div className="pfill" style={{width:cp+'%',background:cp>=80?'var(--green)':cp>=50?'var(--yellow)':'var(--red)'}}/>
                </div>
                {cp<80&&<div style={{fontSize:'.68rem',color:'var(--text3)',marginTop:'.25rem'}}>Complete for better matching</div>}
              </div>
              <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap',justifyContent:'center'}}>
                <Link to="/candidate/profile" className="btn btn-primary btn-sm" style={{flex:1,justifyContent:'center'}}>✏️ Edit Profile</Link>
                <Link to="/candidate/inbox" className="btn btn-ghost btn-sm" style={{flex:1,justifyContent:'center'}}>💬 Inbox</Link>
              </div>
            </div>

            {/* Skills */}
            {candidate?.skills?.length>0&&(
              <div className="card" style={{padding:'1rem'}}>
                <div style={{fontSize:'.72rem',fontWeight:700,color:'var(--text2)',marginBottom:'.6rem',textTransform:'uppercase'}}>Your Skills</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'.3rem'}}>
                  {candidate.skills.map((sk,i)=><span key={i} className="tag">{sk}</span>)}
                </div>
              </div>
            )}

            {/* Projects */}
            {candidate?.projects?.length>0&&(
              <div className="card" style={{padding:'1rem'}}>
                <div style={{fontSize:'.72rem',fontWeight:700,color:'var(--text2)',marginBottom:'.6rem',textTransform:'uppercase'}}>📂 My Projects</div>
                {candidate.projects.slice(0,3).map((p,i)=>(
                  <div key={i} style={{padding:'.5rem 0',borderBottom:'1px solid var(--border)',fontSize:'.78rem'}}>
                    <div style={{fontWeight:700}}>{p.name}</div>
                    {p.techStack&&<div style={{color:'var(--text2)',fontSize:'.7rem'}}>{p.techStack}</div>}
                    {p.link&&<a href={p.link} target="_blank" rel="noreferrer" style={{color:'#60a5fa',fontSize:'.7rem'}}>View →</a>}
                  </div>
                ))}
                <Link to="/candidate/profile" style={{fontSize:'.72rem',color:'var(--text3)',marginTop:'.5rem',display:'block'}}>+ Manage Projects</Link>
              </div>
            )}

            {/* Quick Links */}
            <div className="card" style={{padding:'1rem'}}>
              <div style={{fontSize:'.72rem',fontWeight:700,color:'var(--text2)',marginBottom:'.6rem',textTransform:'uppercase'}}>🔗 Quick Links</div>
              <div style={{display:'flex',flexDirection:'column',gap:'.4rem'}}>
                {candidate?.github&&<a href={candidate.github} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{justifyContent:'flex-start'}}>🐙 GitHub</a>}
                {candidate?.linkedin&&<a href={candidate.linkedin} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{justifyContent:'flex-start'}}>💼 LinkedIn</a>}
                {candidate?.resume&&<a href={`${API}${candidate.resume}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{justifyContent:'flex-start'}}>📄 Resume</a>}
                {(!candidate?.github||!candidate?.linkedin)&&(
                  <Link to="/candidate/profile" style={{fontSize:'.74rem',color:'var(--text3)'}}>+ Complete profile for better score</Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Info=({l,v})=>(
  <div>
    <div style={{fontSize:'.62rem',color:'var(--text3)',fontWeight:700,textTransform:'uppercase'}}>{l}</div>
    <div style={{fontSize:'.78rem',fontWeight:700}}>{v}</div>
  </div>
);
