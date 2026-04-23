import React,{useState,useEffect,useRef} from 'react';
import {useParams,Link,useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import ScoreRing from '../components/ScoreRing';

const API='http://localhost:5000';
const STATI=['screening','shortlisted','interview','offered','rejected'];
const SC={screening:'#7b8fc3',shortlisted:'#22c55e',interview:'#06b6d4',offered:'#eab308',rejected:'#ef4444'};

export default function Applicants(){
  const {jobId}=useParams();
  const nav=useNavigate();
  const [apps,setApps]=useState([]);
  const [stats,setStats]=useState({});
  const [job,setJob]=useState(null);
  const [loading,setLoading]=useState(true);
  const [sel,setSel]=useState(null);
  const [chatOpen,setChatOpen]=useState(false);
  const [msgs,setMsgs]=useState([]);
  const [newMsg,setNewMsg]=useState('');
  const [sending,setSending]=useState(false);
  const [togglingMsg,setTogglingMsg]=useState(false);

  const toggleMessaging=async app=>{
    setTogglingMsg(true);
    try{
      const {data}=await axios.put('/api/messages/hr/toggle-messaging/'+app._id);
      setApps(a=>a.map(x=>x._id===app._id?{...x,messagingDisabled:data.messagingDisabled}:x));
      setSel(s=>s?._id===app._id?{...s,messagingDisabled:data.messagingDisabled}:s);
      toast.success(data.message);
    }catch{toast.error('Failed to toggle messaging');}
    finally{setTogglingMsg(false);}
  };
  const msgEnd=useRef(null);

  // Filters
  const [filter,setFilter]=useState('all');
  const [search,setSearch]=useState('');
  const [minExp,setMinExp]=useState('');
  const [maxExp,setMaxExp]=useState('');
  const [skill,setSkill]=useState('');

  const fetch=async()=>{
    try{
      const {data}=await axios.get(`/api/applications/job/${jobId}`,{params:{filter,search,minExp,maxExp,skill}});
      setApps(data.applications||[]);setStats(data.stats||{});setJob(data.job);
    }catch{toast.error('Failed to load');}
    finally{setLoading(false);}
  };
  useEffect(()=>{fetch();},[filter,search,minExp,maxExp,skill]);

  const loadMsgs=async appId=>{
    const {data}=await axios.get(`/api/messages/${appId}`);
    setMsgs(data.messages||[]);
    setTimeout(()=>msgEnd.current?.scrollIntoView({behavior:'smooth'}),100);
  };

  const openChat=app=>{setSel(app);setChatOpen(true);loadMsgs(app._id);};

  const sendMsg=async()=>{
    if(!newMsg.trim()||!sel)return;
    setSending(true);
    try{
      await axios.post('/api/messages/hr',{applicationId:sel._id,text:newMsg.trim()});
      setNewMsg('');
      await loadMsgs(sel._id);
    }catch{toast.error('Send failed');}
    finally{setSending(false);}
  };

  const updateStatus=async(appId,status)=>{
    await axios.put(`/api/applications/${appId}/status`,{status});
    setApps(a=>a.map(x=>x._id===appId?{...x,status}:x));
    if(sel?._id===appId)setSel(s=>({...s,status}));
    toast.success('Status updated');
  };

  const getScoreBtn=(score)=>{
    if(score>=75)return{cls:'btn-green',label:'✓ Accept',glow:'glow-green'};
    if(score>=50)return{cls:'btn-yellow',label:'⚡ Maybe',glow:''};
    return{cls:'btn-red',label:'✗ Reject',glow:''};
  };

  if(loading)return <Loader/>;

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div className="container" style={{padding:'2rem 1.5rem'}}>
        {/* Header */}
        <button onClick={()=>nav('/hr')} style={{background:'none',border:'none',color:'var(--text2)',cursor:'pointer',fontSize:'.82rem',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:'.3rem'}}>← Dashboard</button>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'1rem',marginBottom:'1.5rem'}}>
          <div>
            <h1 style={{fontSize:'1.7rem',fontWeight:800,marginBottom:'.2rem'}}>{job?.title}</h1>
            <p style={{color:'var(--text2)',fontSize:'.84rem'}}>{job?.company} · {job?.location} · {job?.jobType}</p>
          </div>
          <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/apply/${job?.applicationToken}`);toast.success('Link copied!');}} className="btn btn-ghost btn-sm">📋 Copy Apply Link</button>
        </div>

        {/* Stats Bar */}
        <div style={{display:'flex',gap:'.6rem',flexWrap:'wrap',marginBottom:'1.5rem'}}>
          {[
            {l:'Total',v:stats.total||0,c:'var(--text2)',f:'all'},
            {l:'⭐ Top',v:stats.top||0,c:'var(--green)',f:'top'},
            {l:'👍 Good',v:stats.good||0,c:'#60a5fa',f:'good'},
            {l:'📊 Average',v:stats.average||0,c:'var(--yellow)',f:'average'},
            {l:'❌ Rejected',v:stats.rejected||0,c:'var(--red)',f:'rejected'},
          ].map(s=>(
            <button key={s.f} onClick={()=>setFilter(s.f)} style={{
              display:'flex',alignItems:'center',gap:'.6rem',padding:'.6rem 1rem',
              background:filter===s.f?'var(--card2)':'var(--card)',
              border:`1px solid ${filter===s.f?'var(--accent)':'var(--border)'}`,
              borderRadius:9,cursor:'pointer',transition:'all .15s',
            }}>
              <span style={{fontSize:'1.4rem',fontWeight:800,color:s.c,fontFamily:'Bricolage Grotesque'}}>{s.v}</span>
              <span style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:600}}>{s.l}</span>
            </button>
          ))}
        </div>

        {/* Filter Row */}
        <div style={{display:'flex',gap:'.6rem',flexWrap:'wrap',marginBottom:'1.25rem',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search name, email, skill..." style={{flex:1,minWidth:180,maxWidth:260,padding:'.5rem .9rem',fontSize:'.82rem'}}/>
          <input value={minExp} onChange={e=>setMinExp(e.target.value)} placeholder="Min Exp (yr)" type="number" style={{width:110,padding:'.5rem .8rem',fontSize:'.82rem'}}/>
          <input value={maxExp} onChange={e=>setMaxExp(e.target.value)} placeholder="Max Exp (yr)" type="number" style={{width:110,padding:'.5rem .8rem',fontSize:'.82rem'}}/>
          <input value={skill} onChange={e=>setSkill(e.target.value)} placeholder="Filter skill..." style={{width:130,padding:'.5rem .8rem',fontSize:'.82rem'}}/>
          {(search||minExp||maxExp||skill)&&(
            <button onClick={()=>{setSearch('');setMinExp('');setMaxExp('');setSkill('');}} className="btn btn-ghost btn-sm">✕ Clear</button>
          )}
        </div>

        {/* Main grid */}
        <div style={{display:'grid',gridTemplateColumns:sel||chatOpen?'1fr 400px':'1fr',gap:'1rem',alignItems:'start'}}>

          {/* Applicants list */}
          <div>
            {apps.length===0?(
              <div className="card" style={{textAlign:'center',padding:'4rem',color:'var(--text2)'}}>
                <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📭</div>
                <h3 style={{color:'var(--text)',marginBottom:'.5rem'}}>No applicants {filter!=='all'?`in "${filter}"`:'yet'}</h3>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'.6rem'}}>
                {apps.map((app,idx)=>{
                  const fs=app.scores?.finalScore||0;
                  const btn=getScoreBtn(fs);
                  const isSel=sel?._id===app._id;
                  return(
                    <div key={app._id} className="card" style={{padding:'1rem 1.2rem',cursor:'pointer',border:isSel?'1px solid var(--accent)':'1px solid var(--border)',transition:'all .15s'}}
                      onClick={()=>setSel(isSel?null:app)}>
                      <div style={{display:'flex',gap:'.9rem',alignItems:'center'}}>
                        {/* Rank */}
                        <div style={{width:24,flexShrink:0,textAlign:'center',fontSize:'.7rem',color:'var(--text3)',fontWeight:700}}>#{idx+1}</div>
                        <ScoreRing score={fs} size={54} thick={5}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'.4rem',marginBottom:'.25rem'}}>
                            <div>
                              <div style={{fontWeight:800,fontSize:'.9rem'}}>{app.fullName}</div>
                              <div style={{color:'var(--text2)',fontSize:'.74rem'}}>{app.email}{app.phone?` · ${app.phone}`:''}</div>
                            </div>
                            <div style={{display:'flex',gap:'.35rem',alignItems:'center',flexWrap:'wrap'}}>
                              <span className={`badge badge-${app.aiRecommendation||'pending'}`}>{app.aiRecommendation==='top'?'⭐ Top':app.aiRecommendation==='good'?'👍 Good':app.aiRecommendation==='average'?'📊 Avg':app.aiRecommendation==='rejected'?'❌ Low':'⏳'}</span>
                              <select value={app.status||'screening'} onChange={e=>{e.stopPropagation();updateStatus(app._id,e.target.value);}} onClick={e=>e.stopPropagation()}
                                style={{background:'var(--bg2)',border:'1px solid var(--border)',color:SC[app.status]||'var(--text2)',borderRadius:6,padding:'.18rem .4rem',fontSize:'.7rem',fontWeight:700,cursor:'pointer'}}>
                                {STATI.map(st=><option key={st} value={st} style={{color:'var(--text)'}}>{st}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Score mini bars */}
                          <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap',marginBottom:'.3rem'}}>
                            {[['Skills',app.scores?.skillMatch],['Resume',app.scores?.resumeMatch],['GitHub',app.scores?.githubScore],['LinkedIn',app.scores?.linkedinScore],['Intent',app.scores?.intentScore]].map(([lb,sc])=>(
                              <div key={lb} style={{display:'flex',alignItems:'center',gap:'.25rem'}}>
                                <span style={{fontSize:'.62rem',color:'var(--text3)'}}>{lb}</span>
                                <span style={{fontSize:'.72rem',fontWeight:800,color:(sc||0)>=70?'var(--green)':(sc||0)>=50?'var(--yellow)':'var(--red)'}}>{sc||0}%</span>
                              </div>
                            ))}
                            {app.experience>0&&<div style={{fontSize:'.7rem',color:'var(--text2)'}}>{app.experience}yr</div>}
                          </div>

                          <div style={{display:'flex',gap:'.3rem',flexWrap:'wrap'}}>
                            {app.skills?.slice(0,5).map((sk,i)=><span key={i} className="tag">{sk}</span>)}
                            {(app.skills?.length||0)>5&&<span style={{fontSize:'.65rem',color:'var(--text3)'}}>+{app.skills.length-5}</span>}
                          </div>
                        </div>

                        {/* Accept/Reject Button */}
                        <div style={{flexShrink:0}} onClick={e=>e.stopPropagation()}>
                          <button className={`btn btn-sm ${btn.cls} ${btn.glow}`} onClick={()=>{
                            const st=fs>=75?'shortlisted':fs>=50?'screening':'rejected';
                            updateStatus(app._id,st);
                            toast.success(fs>=75?`✅ ${app.fullName} accepted!`:fs>=50?`⚡ Marked for review`:`❌ ${app.fullName} rejected`);
                          }}>
                            {btn.label}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail + Chat Panel */}
          {sel&&(
            <div style={{position:'sticky',top:80,display:'flex',flexDirection:'column',gap:'1rem'}}>
              {!chatOpen?(
                <div className="card" style={{padding:'1.4rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.1rem'}}>
                    <h3 style={{fontWeight:800,fontSize:'.95rem'}}>Candidate Profile</h3>
                    <button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:'var(--text2)',cursor:'pointer',fontSize:'1.3rem',lineHeight:1}}>×</button>
                  </div>

                  {/* Avatar + Name */}
                  <div style={{textAlign:'center',marginBottom:'1.1rem'}}>
                    <div style={{width:62,height:62,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1.4rem',color:'#fff',margin:'0 auto .7rem'}}>{sel.fullName?.[0]?.toUpperCase()}</div>
                    <ScoreRing score={sel.scores?.finalScore||0} size={78} label="Final Score"/>
                    <div style={{fontWeight:800,fontSize:'1rem',marginTop:'.7rem'}}>{sel.fullName}</div>
                    <div style={{color:'var(--text2)',fontSize:'.76rem'}}>{sel.email}</div>
                    {sel.currentRole&&<div style={{fontSize:'.78rem',color:'#60a5fa',fontWeight:700,marginTop:'.2rem'}}>{sel.currentRole}{sel.currentCompany?` @ ${sel.currentCompany}`:''}</div>}
                  </div>

                  {/* Score Breakdown */}
                  <div style={{marginBottom:'1.1rem'}}>
                    <div style={{fontSize:'.68rem',fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'.6rem'}}>Score Breakdown</div>
                    {[['🛠 Skill Match',sel.scores?.skillMatch],['📄 Resume',sel.scores?.resumeMatch],['🐙 GitHub',sel.scores?.githubScore],['💼 LinkedIn',sel.scores?.linkedinScore],['⏳ Experience',sel.scores?.experienceScore],['🧠 Intent',sel.scores?.intentScore]].map(([lb,sc])=>{
                      const v=sc||0;const col=v>=70?'var(--green)':v>=50?'var(--yellow)':'var(--red)';
                      return(
                        <div key={lb} style={{marginBottom:'.5rem'}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:'.72rem',marginBottom:'.2rem'}}>
                            <span style={{color:'var(--text2)'}}>{lb}</span>
                            <span style={{fontWeight:800,color:col}}>{v}%</span>
                          </div>
                          <div className="pbar"><div className="pfill" style={{width:`${v}%`,background:col}}/></div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Summary */}
                  {sel.aiSummary&&(
                    <div style={{background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.15)',borderRadius:8,padding:'.85rem',marginBottom:'1rem'}}>
                      <div style={{fontSize:'.65rem',fontWeight:700,color:'#60a5fa',marginBottom:'.35rem',textTransform:'uppercase'}}>🤖 AI Summary</div>
                      <p style={{fontSize:'.76rem',color:'var(--text2)',lineHeight:1.65}}>{sel.aiSummary}</p>
                    </div>
                  )}

                  {/* Strengths & Gaps */}
                  {(sel.aiStrengths?.length>0||sel.aiWeaknesses?.length>0)&&(
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.7rem',marginBottom:'1rem'}}>
                      <div><div style={{fontSize:'.65rem',fontWeight:700,color:'var(--green)',marginBottom:'.35rem',textTransform:'uppercase'}}>✓ Strengths</div>{sel.aiStrengths?.map((s,i)=><div key={i} style={{fontSize:'.7rem',color:'var(--text2)',marginBottom:'.2rem',lineHeight:1.4}}>• {s}</div>)}</div>
                      <div><div style={{fontSize:'.65rem',fontWeight:700,color:'var(--red)',marginBottom:'.35rem',textTransform:'uppercase'}}>⚠ Gaps</div>{sel.aiWeaknesses?.map((w,i)=><div key={i} style={{fontSize:'.7rem',color:'var(--text2)',marginBottom:'.2rem',lineHeight:1.4}}>• {w}</div>)}</div>
                    </div>
                  )}

                  {/* Info */}
                  <div style={{background:'var(--bg2)',borderRadius:8,padding:'.8rem',marginBottom:'1rem'}}>
                    {[['Exp',sel.experience?`${sel.experience} yrs`:'—'],['Education',sel.education||'—'],['Location',sel.location||'—'],['Salary',sel.expectedSalary?`₹${Number(sel.expectedSalary).toLocaleString()}`:'—'],['Notice',sel.noticePeriod||'—']].map(([k,v])=>(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'.28rem 0',borderBottom:'1px solid var(--border)',fontSize:'.73rem'}}>
                        <span style={{color:'var(--text2)'}}>{k}</span>
                        <span style={{fontWeight:700,maxWidth:'55%',textAlign:'right'}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Links */}
                  <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap',marginBottom:'1rem'}}>
                    {sel.github&&<a href={sel.github} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🐙 GitHub</a>}
                    {sel.linkedin&&<a href={sel.linkedin} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">💼 LinkedIn</a>}
                    {sel.portfolio&&<a href={sel.portfolio} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🌐 Portfolio</a>}
                    {sel.resume&&<a href={`${API}${sel.resume}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">📄 Resume</a>}
                  </div>

                  {/* Status + Message */}
                  <div className="fg" style={{marginBottom:'.75rem'}}>
                    <label>Update Status</label>
                    <select value={sel.status||'screening'} onChange={e=>updateStatus(sel._id,e.target.value)} style={{color:SC[sel.status]||'var(--text)',fontWeight:700}}>
                      {STATI.map(st=><option key={st} value={st}>{st.charAt(0).toUpperCase()+st.slice(1)}</option>)}
                    </select>
                  </div>

                  <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',marginBottom:'.5rem'}}>
                    <button onClick={()=>openChat(sel)} className="btn btn-primary" style={{flex:1,justifyContent:'center'}}>
                      💬 Message
                    </button>
                    <button onClick={()=>toggleMessaging(sel)} disabled={togglingMsg}
                      className={'btn btn-sm '+(sel.messagingDisabled?'btn-green':'btn-red')}
                      title={sel.messagingDisabled?'Enable replies':'Disable replies'}>
                      {sel.messagingDisabled?'🔊 Unmute':'🔇 Mute'}
                    </button>
                  </div>
                  {sel.messagingDisabled&&(
                    <div style={{fontSize:'.72rem',color:'var(--red)',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:7,padding:'.5rem .75rem',marginBottom:'.5rem'}}>
                      🔇 Candidate replies disabled
                    </div>
                  )}

                  {sel.coverLetter&&(
                    <details style={{marginTop:'.75rem'}}>
                      <summary style={{fontSize:'.76rem',fontWeight:700,color:'var(--text2)',cursor:'pointer',padding:'.4rem 0'}}>✍️ Cover Letter ({sel.coverLetter.length} chars)</summary>
                      <div style={{marginTop:'.5rem',padding:'.8rem',background:'var(--bg2)',borderRadius:8,fontSize:'.73rem',color:'var(--text2)',lineHeight:1.7,maxHeight:160,overflowY:'auto'}}>{sel.coverLetter}</div>
                    </details>
                  )}
                </div>
              ):(
                /* Chat Panel */
                <div className="card" style={{padding:0,overflow:'hidden',display:'flex',flexDirection:'column',height:560}}>
                  <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--card2)'}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:'.9rem'}}>💬 {sel.fullName}</div>
                      <div style={{color:'var(--text2)',fontSize:'.73rem'}}>{sel.email}</div>
                    </div>
                    <button onClick={()=>setChatOpen(false)} style={{background:'none',border:'none',color:'var(--text2)',cursor:'pointer',fontSize:'1.2rem'}}>×</button>
                  </div>

                  {/* Messages */}
                  <div style={{flex:1,overflowY:'auto',padding:'1rem',display:'flex',flexDirection:'column',gap:'.6rem'}}>
                    {msgs.length===0&&(
                      <div style={{textAlign:'center',color:'var(--text2)',fontSize:'.82rem',padding:'2rem'}}>No messages yet. Start the conversation!</div>
                    )}
                    {msgs.map(m=>(
                      <div key={m._id} style={{display:'flex',flexDirection:'column',alignItems:m.senderRole==='hr'?'flex-end':'flex-start'}}>
                        <div style={{maxWidth:'80%',padding:'.65rem .9rem',borderRadius:m.senderRole==='hr'?'12px 12px 2px 12px':'12px 12px 12px 2px',
                          background:m.senderRole==='hr'?'var(--accent)':'var(--card2)',fontSize:'.82rem',lineHeight:1.5}}>
                          {m.text}
                        </div>
                        <div style={{fontSize:'.65rem',color:'var(--text3)',marginTop:'.2rem'}}>{new Date(m.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                    ))}
                    <div ref={msgEnd}/>
                  </div>

                  {/* Input */}
                  <div style={{padding:'.75rem 1rem',borderTop:'1px solid var(--border)',display:'flex',gap:'.5rem'}}>
                    <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                      placeholder="Type a message... (Enter to send)" style={{flex:1,padding:'.6rem .9rem',fontSize:'.82rem'}}/>
                    <button onClick={sendMsg} className="btn btn-primary btn-sm" disabled={sending||!newMsg.trim()}>
                      {sending?<span className="spin"/>:'Send'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
const Loader=()=><div style={{display:'flex',justifyContent:'center',padding:'5rem'}}><div className="spin" style={{width:40,height:40}}/></div>;
