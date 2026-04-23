import React,{useState,useEffect,useRef} from 'react';
import {useParams,useNavigate,Link} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import {useAuth} from '../context/AuthContext';

const STEPS=['Personal','Professional','Skills & Projects','Cover Letter','Submit'];

export default function ApplyForm(){
  const {token}=useParams();
  const nav=useNavigate();
  const {candidate,authMode}=useAuth();
  const [job,setJob]=useState(null);
  const [status,setStatus]=useState('loading');
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [resumeFile,setResumeFile]=useState(null);

  const startTime=useRef(Date.now());
  const pasteRef=useRef(false);
  const tabRef=useRef(0);
  const mouseRef=useRef(0);
  const typingStart=useRef(null);
  const charsRef=useRef(0);

  const [form,setForm]=useState({
    fullName:'',email:'',phone:'',location:'',
    currentRole:'',currentCompany:'',experience:'',education:'',
    skills:'',github:'',linkedin:'',portfolio:'',expectedSalary:'',noticePeriod:'',
    coverLetter:'',
  });
  const [projects,setProjects]=useState([{name:'',description:'',link:'',techStack:''}]);

  useEffect(()=>{
    // If not logged in as candidate, show login prompt
    if(authMode && authMode !== 'candidate'){
      setStatus('wrong_role');return;
    }
    axios.get(`/api/jobs/apply/${token}`)
      .then(r=>{
        setJob(r.data.job);
        if(authMode==='candidate' && candidate){
          // Pre-fill from profile
          setForm(f=>({...f,
            fullName:candidate.name||'',email:candidate.email||'',phone:candidate.phone||'',
            location:candidate.location||'',currentRole:candidate.currentRole||'',
            currentCompany:candidate.currentCompany||'',experience:candidate.experience||'',
            education:candidate.education||'',skills:candidate.skills?.join(', ')||'',
            github:candidate.github||'',linkedin:candidate.linkedin||'',
            portfolio:candidate.portfolio||'',expectedSalary:candidate.expectedSalary||'',
            noticePeriod:candidate.noticePeriod||'',
          }));
          if(candidate.projects?.length>0) setProjects(candidate.projects.map(p=>({name:p.name||'',description:p.description||'',link:p.link||'',techStack:p.techStack||''})));
          setStatus('open');
        } else if(!authMode){
          setStatus('need_login');
        } else {
          setStatus('open');
        }
      })
      .catch(e=>{
        const msg=e.response?.data?.message||'';
        setStatus(msg.includes('expired')?'expired':msg.includes('closed')?'closed':'error');
      });

    const mm=()=>mouseRef.current++;
    const vs=()=>{if(document.hidden)tabRef.current++;};
    window.addEventListener('mousemove',mm);
    document.addEventListener('visibilitychange',vs);
    return()=>{window.removeEventListener('mousemove',mm);document.removeEventListener('visibilitychange',vs);};
  },[token,authMode,candidate]);

  const set=(k,v)=>{
    setForm(f=>({...f,[k]:v}));
    if(!typingStart.current)typingStart.current=Date.now();
    charsRef.current++;
  };

  const addProject=()=>setProjects(p=>[...p,{name:'',description:'',link:'',techStack:''}]);
  const removeProject=idx=>setProjects(p=>p.filter((_,i)=>i!==idx));
  const setProject=(idx,field,val)=>setProjects(p=>p.map((pr,i)=>i===idx?{...pr,[field]:val}:pr));

  const submit=async()=>{
    if(!form.fullName||!form.email){toast.error('Name and email required');return;}
    setLoading(true);
    try{
      const fillTime=Math.floor((Date.now()-startTime.current)/1000);
      const typingMin=typingStart.current?(Date.now()-typingStart.current)/60000:1;
      const typingSpeed=Math.round(charsRef.current/5/Math.max(typingMin,.1));
      const intentData={formFillTime:fillTime,copyPasteDetected:pasteRef.current,mouseMovements:mouseRef.current,tabSwitches:tabRef.current,typingSpeed,coverLetterLength:form.coverLetter.length,isRobotic:fillTime<25||mouseRef.current<3};

      const fd=new FormData();
      Object.entries(form).forEach(([k,v])=>fd.append(k,v||''));
      fd.append('intentData',JSON.stringify(intentData));
      fd.append('projects',JSON.stringify(projects.filter(p=>p.name.trim())));
      if(resumeFile)fd.append('resume',resumeFile);

      await axios.post(`/api/applications/submit/${token}`,fd,{headers:{'Content-Type':'multipart/form-data'}});
      setStatus('success');
    }catch(e){
      if(e.response?.data?.requireLogin){nav('/login');return;}
      toast.error(e.response?.data?.message||'Submission failed');
    }
    finally{setLoading(false);}
  };

  // Status screens
  if(status==='loading')return<Screen><div className="spin" style={{width:44,height:44}}/></Screen>;

  if(status==='need_login'||status==='wrong_role')return(
    <Screen>
      <div style={{textAlign:'center',maxWidth:460}}>
        <div style={{fontSize:'3.5rem',marginBottom:'1rem'}}>🔐</div>
        <h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'.75rem'}}>Login Required to Apply</h1>
        <p style={{color:'var(--text2)',lineHeight:1.7,marginBottom:'1.5rem'}}>
          {status==='wrong_role'?'Please login as a Candidate (not HR) to apply for jobs.':'You need a Candidate account to apply. Login or create a free account.'}
        </p>
        {job&&(
          <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.2)',borderRadius:10,padding:'1rem',marginBottom:'1.5rem',textAlign:'left'}}>
            <div style={{fontWeight:800,marginBottom:'.25rem'}}>{job.title}</div>
            <div style={{color:'var(--text2)',fontSize:'.82rem'}}>{job.company} · {job.location}</div>
          </div>
        )}
        <div style={{display:'flex',gap:'.75rem',justifyContent:'center'}}>
          <button onClick={()=>nav('/login',{state:{from:`/apply/${token}`,jobTitle:job?.title}})} className="btn btn-primary btn-lg">Login to Apply →</button>
          <button onClick={()=>nav('/register',{state:{from:`/apply/${token}`}})} className="btn btn-ghost btn-lg">Create Account</button>
        </div>
        <p style={{color:'var(--text3)',fontSize:'.78rem',marginTop:'1rem'}}>Creating an account lets you track all your applications in one place</p>
      </div>
    </Screen>
  );

  if(status==='success')return(
    <Screen>
      <div style={{textAlign:'center',maxWidth:500}}>
        <div style={{fontSize:'4.5rem',marginBottom:'1rem'}}>✅</div>
        <h1 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'.75rem'}}>Application Submitted!</h1>
        <p style={{color:'var(--text2)',lineHeight:1.7,marginBottom:'1.5rem'}}>Your application has been received and AI is analyzing your profile. The hiring team will contact you if shortlisted.</p>
        <div style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.2)',borderRadius:10,padding:'1rem',marginBottom:'1.5rem',fontSize:'.82rem',color:'var(--text2)'}}>
          🔒 <strong style={{color:'var(--green)'}}>Your AI score is private.</strong> Only the HR team can see it. You will be notified if selected.
        </div>
        <div style={{display:'flex',gap:'.75rem',justifyContent:'center'}}>
          <button onClick={()=>nav('/candidate')} className="btn btn-primary btn-lg">View My Applications →</button>
        </div>
      </div>
    </Screen>
  );

  if(status==='expired')return<Screen><Msg icon="⏰" t="Link Expired" s="This application link has expired."/></Screen>;
  if(status==='closed')return<Screen><Msg icon="🔒" t="Position Closed" s="This job is no longer accepting applications."/></Screen>;
  if(status==='error')return<Screen><Msg icon="❌" t="Invalid Link" s="This link is invalid or removed."/></Screen>;

  const pct=((step-1)/(STEPS.length-1))*100;
  const jobSkills=job?.skills||[];

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',paddingBottom:'4rem'}} onPaste={()=>pasteRef.current=true}>
      {/* Banner */}
      <div style={{background:'linear-gradient(135deg,rgba(59,130,246,.12),rgba(99,102,241,.08))',borderBottom:'1px solid var(--border)',padding:'1.25rem 0'}}>
        <div style={{maxWidth:680,margin:'0 auto',padding:'0 1.5rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.4rem'}}>
            <span style={{fontSize:'.68rem',fontWeight:800,color:'#60a5fa',textTransform:'uppercase',letterSpacing:'.08em'}}>🤖 AI Intent Review — Application</span>
          </div>
          <h1 style={{fontSize:'1.3rem',fontWeight:800,marginBottom:'.2rem'}}>{job?.title}</h1>
          <p style={{color:'var(--text2)',fontSize:'.8rem'}}>{job?.company} · {job?.location} · {job?.jobType} · {job?.workMode}
            {job?.salaryVisible&&job?.salaryMax>0?` · ₹${(job.salaryMin/100000).toFixed(1)}–${(job.salaryMax/100000).toFixed(1)} LPA`:''}
          </p>
          {jobSkills.length>0&&<div style={{display:'flex',gap:'.28rem',flexWrap:'wrap',marginTop:'.4rem'}}>{jobSkills.map((s,i)=><span key={i} style={{background:'rgba(59,130,246,.1)',color:'#60a5fa',border:'1px solid rgba(59,130,246,.2)',padding:'.1rem .45rem',borderRadius:100,fontSize:'.65rem',fontWeight:700}}>{s}</span>)}</div>}
          {candidate&&<div style={{marginTop:'.5rem',fontSize:'.75rem',color:'var(--green)',fontWeight:600}}>✓ Applying as {candidate.name}</div>}
        </div>
      </div>

      <div style={{maxWidth:680,margin:'0 auto',padding:'1.75rem 1.5rem'}}>
        {/* Progress */}
        <div style={{marginBottom:'1.5rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.35rem'}}>
            <span style={{fontSize:'.73rem',fontWeight:700,color:'var(--text2)'}}>Step {step}/{STEPS.length} — {STEPS[step-1]}</span>
            <span style={{fontSize:'.73rem',color:'var(--text3)'}}>{Math.round(pct)}%</span>
          </div>
          <div className="pbar" style={{height:5}}><div className="pfill" style={{width:`${pct}%`,background:'linear-gradient(90deg,#3b82f6,#6366f1)'}}/></div>
          <div style={{display:'flex',gap:'.18rem',marginTop:'.45rem'}}>{STEPS.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<step?'var(--accent)':'var(--border)',transition:'background .3s'}}/>)}</div>
        </div>

        <div className="card fu" style={{padding:'1.75rem'}}>
          {/* Step 1 */}
          {step===1&&(<div>
            <SH icon="👤" t="Personal Info" s="Basic contact details"/>
            <div className="g2">
              <FF l="Full Name *" v={form.fullName} c={v=>set('fullName',v)} p="John Doe"/>
              <FF l="Email *" v={form.email} c={v=>set('email',v)} p="john@gmail.com" t="email"/>
              <FF l="Phone" v={form.phone} c={v=>set('phone',v)} p="+91 98765 43210"/>
              <FF l="Location" v={form.location} c={v=>set('location',v)} p="Delhi, India"/>
            </div>
          </div>)}

          {/* Step 2 */}
          {step===2&&(<div>
            <SH icon="💼" t="Professional Background" s="Experience and education"/>
            <div className="g2">
              <FF l="Current Role" v={form.currentRole} c={v=>set('currentRole',v)} p="Software Engineer"/>
              <FF l="Current Company" v={form.currentCompany} c={v=>set('currentCompany',v)} p="Company Name"/>
              <FF l="Experience (years) *" v={form.experience} c={v=>set('experience',v)} t="number" p="2"/>
              <FF l="Education" v={form.education} c={v=>set('education',v)} p="B.Tech CS, 2022"/>
              <FF l="Expected Salary (₹/yr)" v={form.expectedSalary} c={v=>set('expectedSalary',v)} t="number" p="600000"/>
              <div className="fg"><label>Notice Period</label><select value={form.noticePeriod} onChange={e=>set('noticePeriod',e.target.value)}><option value="">Select...</option>{['Immediate','15 days','30 days','45 days','60 days','90 days'].map(n=><option key={n}>{n}</option>)}</select></div>
            </div>
          </div>)}

          {/* Step 3: Skills + Projects */}
          {step===3&&(<div>
            <SH icon="🛠️" t="Skills & Projects" s="Analyzed by AI engine for scoring"/>
            <div className="fg">
              <label>Your Skills *</label>
              <input value={form.skills} onChange={e=>set('skills',e.target.value)} placeholder="React, Node.js, Python..."/>
              {jobSkills.length>0&&<div style={{marginTop:'.4rem'}}><div style={{fontSize:'.67rem',color:'var(--text3)',marginBottom:'.3rem'}}>Required skills (click to add):</div><div style={{display:'flex',flexWrap:'wrap',gap:'.25rem'}}>{jobSkills.map((s,i)=><button key={i} type="button" onClick={()=>set('skills',form.skills?form.skills+', '+s:s)} style={{padding:'.12rem .45rem',borderRadius:100,border:'1px solid rgba(59,130,246,.3)',background:'rgba(59,130,246,.08)',color:'#60a5fa',fontSize:'.67rem',cursor:'pointer'}}>+ {s}</button>)}</div></div>}
            </div>

            {/* AI Tip */}
            <div style={{background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.15)',borderRadius:9,padding:'.8rem',marginBottom:'1rem'}}>
              <div style={{fontSize:'.68rem',fontWeight:700,color:'#60a5fa',marginBottom:'.3rem'}}>🤖 AI Scoring Tip</div>
              <div style={{fontSize:'.74rem',color:'var(--text2)',lineHeight:1.6}}>GitHub + LinkedIn + Projects can add up to <strong style={{color:'#60a5fa'}}>55 points</strong>. Our AI fetches your actual GitHub repos to verify real work!</div>
            </div>

            <FF l="🐙 GitHub Profile URL" v={form.github} c={v=>set('github',v)} p="https://github.com/username"/>
            <FF l="💼 LinkedIn Profile URL" v={form.linkedin} c={v=>set('linkedin',v)} p="https://linkedin.com/in/yourname"/>
            <FF l="🌐 Portfolio / Website" v={form.portfolio} c={v=>set('portfolio',v)} p="https://yoursite.com"/>

            {/* Projects */}
            <div style={{marginTop:'1.1rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.75rem'}}>
                <label style={{fontSize:'.74rem',fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.06em'}}>📂 Projects</label>
                <button type="button" onClick={addProject} className="btn btn-ghost btn-sm">+ Add Project</button>
              </div>
              {projects.map((p,idx)=>(
                <div key={idx} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:9,padding:'1rem',marginBottom:'.75rem',position:'relative'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.6rem'}}>
                    <span style={{fontSize:'.76rem',fontWeight:700,color:'var(--text2)'}}>Project {idx+1}</span>
                    {projects.length>1&&<button type="button" onClick={()=>removeProject(idx)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:'.8rem',fontWeight:700}}>✕ Remove</button>}
                  </div>
                  <div className="g2">
                    <div className="fg"><label>Project Name *</label><input value={p.name} onChange={e=>setProject(idx,'name',e.target.value)} placeholder="E-Commerce Platform"/></div>
                    <div className="fg"><label>Tech Stack</label><input value={p.techStack} onChange={e=>setProject(idx,'techStack',e.target.value)} placeholder="React, Node.js, MongoDB"/></div>
                  </div>
                  <div className="fg"><label>Project Link (GitHub/Live)</label><input value={p.link} onChange={e=>setProject(idx,'link',e.target.value)} placeholder="https://github.com/you/project"/></div>
                  <div className="fg"><label>Description</label><textarea value={p.description} onChange={e=>setProject(idx,'description',e.target.value)} rows={2} placeholder="What does this project do?" style={{resize:'vertical'}}/></div>
                </div>
              ))}
            </div>

            {/* Resume */}
            <div className="fg">
              <label>📄 Resume (PDF/DOC)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={e=>setResumeFile(e.target.files[0])} style={{border:'1.5px dashed var(--border)',background:'transparent',cursor:'pointer'}}/>
              {resumeFile&&<div style={{fontSize:'.72rem',color:'var(--green)',marginTop:'.3rem'}}>✓ {resumeFile.name}</div>}
            </div>
          </div>)}

          {/* Step 4: Cover Letter */}
          {step===4&&(<div>
            <SH icon="✍️" t="Cover Letter" s="Tell us why you're the right fit"/>
            <div style={{background:'rgba(234,179,8,.06)',border:'1px solid rgba(234,179,8,.2)',borderRadius:9,padding:'.8rem',marginBottom:'1rem'}}>
              <div style={{fontSize:'.68rem',fontWeight:700,color:'var(--yellow)',marginBottom:'.3rem'}}>⚠️ AI Detects Copy-Paste</div>
              <div style={{fontSize:'.74rem',color:'var(--text2)',lineHeight:1.65}}>Write genuinely. AI tracks typing speed, copy-paste behavior, and time taken. A real 300+ word letter boosts your Intent Score significantly.</div>
            </div>
            <div className="fg">
              <label>Your Cover Letter</label>
              <textarea value={form.coverLetter} onChange={e=>set('coverLetter',e.target.value)} rows={11}
                placeholder={`Dear Hiring Team,\n\nI am excited to apply for the ${job?.title} role...\n\n[Write about your relevant experience, why this role excites you, and what you bring to the team]`}
                style={{resize:'vertical',lineHeight:1.7}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'.69rem',marginTop:'.3rem'}}>
                <span style={{color:form.coverLetter.length>300?'var(--green)':'var(--text3)'}}>{form.coverLetter.length} chars {form.coverLetter.length>500?'✓ Excellent!':form.coverLetter.length>300?'✓ Good':'(300+ recommended)'}</span>
              </div>
            </div>
          </div>)}

          {/* Step 5: Review */}
          {step===5&&(<div>
            <SH icon="✅" t="Review & Submit" s="Check everything before submitting"/>
            <div style={{marginBottom:'1.25rem'}}>
              {[['👤 Name',form.fullName],['📧 Email',form.email],['💼 Role',form.currentRole||'—'],['⏳ Exp',form.experience?`${form.experience} yrs`:'—'],['🛠 Skills',form.skills||'—'],['🐙 GitHub',form.github||'—'],['💼 LinkedIn',form.linkedin||'—'],['📂 Projects',`${projects.filter(p=>p.name).length} added`],['📄 Resume',resumeFile?resumeFile.name:'—'],['✍️ Cover',form.coverLetter.length>0?`${form.coverLetter.length} chars`:'—']].map(([k,v])=>(
                <div key={k} style={{display:'flex',gap:'1rem',padding:'.45rem 0',borderBottom:'1px solid var(--border)',fontSize:'.76rem'}}>
                  <span style={{color:'var(--text2)',minWidth:115,fontWeight:600}}>{k}</span>
                  <span style={{color:'var(--text)',fontWeight:500,flex:1,wordBreak:'break-all'}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.2)',borderRadius:9,padding:'.85rem',marginBottom:'1rem',fontSize:'.78rem',color:'var(--text2)'}}>
              🔒 <strong style={{color:'var(--green)'}}>Your AI score is private.</strong> You will not see it. The HR team uses it internally to rank candidates.
            </div>
            <button onClick={submit} className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
              {loading?<><span className="spin"/>Submitting & AI Analyzing...</>:'🚀 Submit Application'}
            </button>
          </div>)}

          {/* Navigation */}
          {step<5&&(
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'1.4rem',paddingTop:'1rem',borderTop:'1px solid var(--border)'}}>
              {step>1?<button onClick={()=>setStep(s=>s-1)} className="btn btn-ghost">← Previous</button>:<div/>}
              <button onClick={()=>{
                if(step===1&&(!form.fullName||!form.email)){toast.error('Name and email required');return;}
                if(step===2&&!form.experience){toast.error('Experience required');return;}
                if(step===3&&!form.skills){toast.error('At least one skill required');return;}
                setStep(s=>s+1);
              }} className="btn btn-primary btn-lg">{step===4?'Review →':'Continue →'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Screen=({children})=>(<div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>{children}</div>);
const Msg=({icon,t,s})=>(<div style={{textAlign:'center'}}><div style={{fontSize:'3.5rem',marginBottom:'1rem'}}>{icon}</div><h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'.5rem'}}>{t}</h1><p style={{color:'var(--text2)'}}>{s}</p></div>);
const SH=({icon,t,s})=>(<div style={{marginBottom:'1.3rem'}}><h2 style={{fontSize:'1.02rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.4rem'}}><span>{icon}</span>{t}</h2><p style={{color:'var(--text2)',fontSize:'.76rem',marginTop:'.15rem'}}>{s}</p></div>);
const FF=({l,v,c,t='text',p=''})=>(<div className="fg"><label>{l}</label><input type={t} value={v} onChange={e=>c(e.target.value)} placeholder={p}/></div>);
