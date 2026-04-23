import React,{useState,useEffect} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import {formatDistanceToNow,isPast} from 'date-fns';
import {useAuth} from '../context/AuthContext';
import ScoreRing from '../components/ScoreRing';

export default function HRDashboard(){
  const {hrUser}=useAuth();
  const nav=useNavigate();
  const [jobs,setJobs]=useState([]);
  const [stats,setStats]=useState({total:0,shortlisted:0,top:0,jobs:0});
  const [recent,setRecent]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([axios.get('/api/jobs/my'),axios.get('/api/applications/hr/stats')])
      .then(([jr,sr])=>{setJobs(jr.data.jobs||[]);setStats(sr.data.stats||{});setRecent(sr.data.recent||[]);})
      .catch(()=>toast.error('Load failed'))
      .finally(()=>setLoading(false));
  },[]);

  const toggleJob=async j=>{
    await axios.put(`/api/jobs/${j._id}`,{isActive:!j.isActive});
    setJobs(js=>js.map(x=>x._id===j._id?{...x,isActive:!x.isActive}:x));
    toast.success(j.isActive?'Job paused':'Job activated');
  };
  const delJob=async id=>{
    if(!window.confirm('Delete this job?'))return;
    await axios.delete(`/api/jobs/${id}`);
    setJobs(js=>js.filter(x=>x._id!==id));
    toast.success('Deleted');
  };
  const copy=link=>{navigator.clipboard.writeText(link);toast.success('Link copied! 📋');};

  if(loading) return <Loader/>;

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div className="container" style={{padding:'2rem 1.5rem'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <h1 style={{fontSize:'1.85rem',fontWeight:800,marginBottom:'.2rem'}}>
              Welcome, {hrUser?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{color:'var(--text2)',fontSize:'.85rem'}}>{hrUser?.company||'HR Dashboard'} — AI-powered recruitment</p>
          </div>
          <Link to="/hr/post-job" className="btn btn-primary btn-lg" style={{gap:'.5rem'}}>
            <span style={{fontSize:'1.1rem'}}>+</span> Post New Job
          </Link>
        </div>

        {/* Stat Cards — all clickable */}
        <div className="g4" style={{marginBottom:'2rem'}}>
          {[
            {label:'Total Applicants',val:stats.total||0,icon:'👥',color:'#3b82f6',link:null,sub:'All applications received'},
            {label:'Shortlisted',val:stats.shortlisted||0,icon:'⭐',color:'#22c55e',link:null,sub:'AI score ≥ 70%'},
            {label:'Top Candidates',val:stats.top||0,icon:'🏆',color:'#eab308',link:null,sub:'AI score ≥ 90%'},
            {label:'Active Jobs',val:stats.jobs||0,icon:'💼',color:'#06b6d4',link:'/hr/post-job',sub:'Click to post new'},
          ].map((s,i)=>(
            <div key={i} onClick={s.link?()=>nav(s.link):undefined}
              className="card" style={{cursor:s.link?'pointer':'default',position:'relative',overflow:'hidden',padding:'1.25rem'}}>
              <div style={{position:'absolute',top:'-10px',right:'-10px',fontSize:'3rem',opacity:.07}}>{s.icon}</div>
              <div style={{fontSize:'2.2rem',fontWeight:800,color:s.color,fontFamily:'Bricolage Grotesque',lineHeight:1}}>{s.val}</div>
              <div style={{fontWeight:700,fontSize:'.88rem',marginTop:'.35rem'}}>{s.label}</div>
              <div style={{fontSize:'.73rem',color:'var(--text2)',marginTop:'.15rem'}}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:'1.5rem',alignItems:'start'}}>
          {/* Jobs List */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h2 style={{fontSize:'1.1rem',fontWeight:800}}>My Job Postings</h2>
              <Link to="/hr/post-job" className="btn btn-ghost btn-sm">+ New Job</Link>
            </div>

            {jobs.length===0?(
              <div className="card" style={{textAlign:'center',padding:'3.5rem',color:'var(--text2)'}}>
                <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📋</div>
                <h3 style={{color:'var(--text)',marginBottom:'.5rem'}}>No jobs yet</h3>
                <p style={{fontSize:'.85rem',marginBottom:'1.5rem'}}>Post your first job and get an AI application link</p>
                <Link to="/hr/post-job" className="btn btn-primary">Post First Job →</Link>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
                {jobs.map(job=>{
                  const expired=isPast(new Date(job.linkExpiry));
                  const alive=job.isActive&&!expired;
                  return(
                    <div key={job._id} className="card" style={{padding:'1.1rem 1.3rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'.75rem'}}>
                        <div style={{flex:1,minWidth:200}}>
                          <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.25rem',flexWrap:'wrap'}}>
                            {/* Clickable title → job status page */}
                            <button onClick={()=>nav(`/hr/job/${job._id}/status`)} style={{background:'none',border:'none',fontFamily:'inherit',fontSize:'.98rem',fontWeight:800,color:'var(--text)',cursor:'pointer',textAlign:'left',padding:0}}
                              onMouseEnter={e=>e.target.style.color='var(--accent)'} onMouseLeave={e=>e.target.style.color='var(--text)'}>
                              {job.title}
                            </button>
                            <span style={{padding:'.12rem .5rem',borderRadius:100,fontSize:'.65rem',fontWeight:800,
                              background:alive?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)',
                              color:alive?'#22c55e':'#ef4444',
                              border:`1px solid ${alive?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}`}}>
                              {alive?'● Live':expired?'● Expired':'● Paused'}
                            </span>
                          </div>
                          <p style={{color:'var(--text2)',fontSize:'.78rem',marginBottom:'.6rem'}}>
                            {job.company} · {job.location} · {job.jobType} · {job.workMode}
                          </p>
                          <div style={{display:'flex',gap:'1.25rem',flexWrap:'wrap'}}>
                            {/* Clickable applicants count */}
                            <button onClick={()=>nav(`/hr/job/${job._id}/applicants`)} style={{background:'none',border:'none',cursor:'pointer',padding:0,textAlign:'left'}}>
                              <div style={{fontSize:'.65rem',color:'var(--text3)',fontWeight:700,textTransform:'uppercase'}}>Applied</div>
                              <div style={{fontSize:'.95rem',fontWeight:800,color:'var(--accent)'}}>{job.totalApplications||0}</div>
                            </button>
                            <div>
                              <div style={{fontSize:'.65rem',color:'var(--text3)',fontWeight:700,textTransform:'uppercase'}}>Views</div>
                              <div style={{fontSize:'.9rem',fontWeight:700}}>{job.views||0}</div>
                            </div>
                            <div>
                              <div style={{fontSize:'.65rem',color:'var(--text3)',fontWeight:700,textTransform:'uppercase'}}>Expires</div>
                              <div style={{fontSize:'.78rem',fontWeight:700,color:expired?'var(--red)':'var(--yellow)'}}>
                                {expired?'Expired':formatDistanceToNow(new Date(job.linkExpiry),{addSuffix:true})}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{display:'flex',flexDirection:'column',gap:'.4rem',alignItems:'flex-end'}}>
                          {/* Apply link */}
                          <div style={{display:'flex',gap:'.35rem',alignItems:'center'}}>
                            <code className="mono" style={{fontSize:'.65rem',color:'var(--text2)',background:'var(--bg2)',padding:'.25rem .6rem',borderRadius:6,border:'1px solid var(--border)',maxWidth:190,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {job.applyLink}
                            </code>
                            <button onClick={()=>copy(job.applyLink)} className="btn btn-ghost btn-sm" title="Copy">📋</button>
                          </div>
                          <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap',justifyContent:'flex-end'}}>
                            <div style={{display:'flex',gap:'.35rem'}}>
                              <button onClick={()=>nav(`/hr/job/${job._id}/status`)} className="btn btn-primary btn-sm">
                                📊 Status ({job.totalApplications||0})
                              </button>
                              <button onClick={()=>nav(`/hr/job/${job._id}/applicants`)} className="btn btn-ghost btn-sm">
                                Full List
                              </button>
                            </div>
                            <button onClick={()=>toggleJob(job)} className="btn btn-ghost btn-sm">
                              {job.isActive?'⏸':'▶'}
                            </button>
                            <button onClick={()=>delJob(job._id)} className="btn btn-sm" style={{background:'rgba(239,68,68,.1)',color:'var(--red)',border:'1px solid rgba(239,68,68,.2)'}}>🗑</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            <div className="card" style={{padding:'1.1rem'}}>
              <h3 style={{fontWeight:800,fontSize:'.9rem',marginBottom:'1rem'}}>🕐 Recent Applications</h3>
              {recent.length===0?(
                <div style={{textAlign:'center',padding:'1.5rem',color:'var(--text2)',fontSize:'.82rem'}}>No applications yet</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
                  {recent.map(app=>(
                    <div key={app._id} style={{display:'flex',alignItems:'center',gap:'.75rem',padding:'.6rem .7rem',background:'var(--bg2)',borderRadius:8,cursor:'pointer'}}
                      onClick={()=>nav(`/hr/job/${app.job?._id}/applicants`)}>
                      <ScoreRing score={app.scores?.finalScore||0} size={40} thick={4}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:'.82rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{app.fullName}</div>
                        <div style={{color:'var(--text2)',fontSize:'.72rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{app.job?.title}</div>
                      </div>
                      <span className={`badge badge-${app.aiRecommendation||'pending'}`}>{app.aiRecommendation||'?'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card" style={{padding:'1.1rem'}}>
              <h3 style={{fontWeight:800,fontSize:'.9rem',marginBottom:'.75rem'}}>⚡ Quick Actions</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'.4rem'}}>
                <Link to="/hr/post-job" className="btn btn-primary btn-sm" style={{justifyContent:'center'}}>+ Post New Job</Link>
                <Link to="/hr/inbox" className="btn btn-ghost btn-sm" style={{justifyContent:'center'}}>💬 Message Candidates</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Loader=()=><div style={{display:'flex',justifyContent:'center',padding:'5rem'}}><div className="spin" style={{width:40,height:40}}/></div>;
