import React,{useState,useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import {useAuth} from '../context/AuthContext';

const API='http://localhost:5000';
const ALL_SKILLS=['React','Node.js','Python','JavaScript','TypeScript','MongoDB','SQL','AWS','Docker','Java','Flutter','Next.js','Vue.js','ML/AI','Data Science','DevOps','Go','PHP','Angular','C++','Swift','Kotlin','Figma'];

export default function CandidateProfile(){
  const {candidate,updateCandidate}=useAuth();
  const nav=useNavigate();
  const avatarRef=useRef();
  const resumeRef=useRef();
  const [tab,setTab]=useState('basic');
  const [saving,setSaving]=useState(false);
  const [uploadingAvatar,setUploadingAvatar]=useState(false);
  const [uploadingResume,setUploadingResume]=useState(false);

  const [form,setForm]=useState({
    name:candidate?.name||'',phone:candidate?.phone||'',bio:candidate?.bio||'',location:candidate?.location||'',
    currentRole:candidate?.currentRole||'',currentCompany:candidate?.currentCompany||'',
    experience:candidate?.experience||0,education:candidate?.education||'',
    skills:candidate?.skills?.join(', ')||'',
    github:candidate?.github||'',linkedin:candidate?.linkedin||'',portfolio:candidate?.portfolio||'',
    expectedSalary:candidate?.expectedSalary||'',noticePeriod:candidate?.noticePeriod||'',
  });
  const [projects,setProjects]=useState(
    candidate?.projects?.length>0
      ? candidate.projects.map(p=>({name:p.name||'',description:p.description||'',link:p.link||'',techStack:p.techStack||'',year:p.year||''}))
      : [{name:'',description:'',link:'',techStack:'',year:''}]
  );

  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  const addSkill=sk=>{const cur=form.skills.split(',').map(x=>x.trim()).filter(Boolean);if(!cur.includes(sk))s('skills',[...cur,sk].join(', '));};
  const addProject=()=>setProjects(p=>[...p,{name:'',description:'',link:'',techStack:'',year:''}]);
  const removeProject=idx=>setProjects(p=>p.filter((_,i)=>i!==idx));
  const setP=(idx,field,val)=>setProjects(p=>p.map((pr,i)=>i===idx?{...pr,[field]:val}:pr));

  const save=async()=>{
    setSaving(true);
    try{
      const payload={...form,skills:form.skills.split(',').map(x=>x.trim()).filter(Boolean),projects:projects.filter(p=>p.name.trim())};
      const {data}=await axios.put('/api/candidate/profile',payload);
      updateCandidate(data.candidate);
      toast.success('Profile saved! ✅');
    }catch(e){toast.error(e.response?.data?.message||'Save failed');}
    finally{setSaving(false);}
  };

  const uploadAvatar=async e=>{
    const file=e.target.files[0];if(!file)return;
    if(!file.type.startsWith('image/')){toast.error('Images only');return;}
    setUploadingAvatar(true);
    const fd=new FormData();fd.append('avatar',file);
    try{const {data}=await axios.put('/api/candidate/avatar',fd,{headers:{'Content-Type':'multipart/form-data'}});updateCandidate(data.candidate);toast.success('Photo updated!');}
    catch{toast.error('Upload failed');}
    finally{setUploadingAvatar(false);}
  };

  const uploadResume=async e=>{
    const file=e.target.files[0];if(!file)return;
    setUploadingResume(true);
    const fd=new FormData();fd.append('resume',file);
    try{const {data}=await axios.put('/api/candidate/resume',fd,{headers:{'Content-Type':'multipart/form-data'}});updateCandidate(data.candidate);toast.success('Resume uploaded!');}
    catch{toast.error('Upload failed');}
    finally{setUploadingResume(false);}
  };

  const avatarSrc=candidate?.avatar?`${API}${candidate.avatar}`:null;
  const tabs=[{id:'basic',l:'👤 Basic'},{id:'professional',l:'💼 Professional'},{id:'links',l:'🔗 Links'},{id:'projects',l:'📂 Projects'}];

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',padding:'2rem 0'}}>
      <div className="container" style={{maxWidth:840}}>
        <button onClick={()=>nav('/candidate')} style={{background:'none',border:'none',color:'var(--text2)',cursor:'pointer',fontSize:'.82rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'.3rem'}}>← Dashboard</button>
        <h1 style={{fontSize:'1.75rem',fontWeight:800,marginBottom:'2rem'}}>My Profile</h1>

        <div style={{display:'grid',gridTemplateColumns:'210px 1fr',gap:'1.5rem',alignItems:'start'}}>
          {/* Sidebar */}
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {/* Avatar */}
            <div className="card" style={{padding:'1.25rem',textAlign:'center'}}>
              <div style={{position:'relative',display:'inline-block',marginBottom:'.75rem'}}>
                {avatarSrc?<img src={avatarSrc} alt="" style={{width:82,height:82,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--border)'}}/>:<div style={{width:82,height:82,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1.7rem',color:'#fff',margin:'0 auto'}}>{candidate?.name?.[0]?.toUpperCase()}</div>}
                <button onClick={()=>avatarRef.current.click()} style={{position:'absolute',bottom:0,right:0,width:25,height:25,borderRadius:'50%',background:'var(--accent)',border:'2px solid var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.65rem',cursor:'pointer'}}>
                  {uploadingAvatar?<span className="spin" style={{width:11,height:11}}/>:'📷'}
                </button>
                <input ref={avatarRef} type="file" accept="image/*" onChange={uploadAvatar} style={{display:'none'}}/>
              </div>
              <div style={{fontWeight:800,fontSize:'.9rem'}}>{candidate?.name}</div>
              <div style={{color:'var(--text2)',fontSize:'.72rem',marginTop:'.2rem'}}>{candidate?.email}</div>
            </div>

            {/* Resume */}
            <div className="card" style={{padding:'1rem'}}>
              <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--text2)',marginBottom:'.6rem',textTransform:'uppercase'}}>📄 Resume</div>
              {candidate?.resume&&<a href={`${API}${candidate.resume}`} target="_blank" rel="noreferrer" style={{display:'block',fontSize:'.74rem',color:'#60a5fa',marginBottom:'.6rem'}}>✓ View Current</a>}
              <button onClick={()=>resumeRef.current.click()} className="btn btn-ghost btn-sm" style={{width:'100%',justifyContent:'center'}}>
                {uploadingResume?<><span className="spin"/>Uploading...</>:'⬆️ Upload Resume'}
              </button>
              <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx" onChange={uploadResume} style={{display:'none'}}/>
            </div>

            {/* Tab nav */}
            <div className="card" style={{padding:'.4rem'}}>
              {tabs.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{display:'block',width:'100%',textAlign:'left',padding:'.52rem .72rem',borderRadius:7,border:'none',cursor:'pointer',fontSize:'.8rem',background:tab===t.id?'rgba(59,130,246,.12)':'transparent',color:tab===t.id?'var(--accent)':'var(--text2)',fontWeight:tab===t.id?700:500,marginBottom:'.12rem',transition:'all .15s'}}>{t.l}</button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="card">
            {tab==='basic'&&(<div>
              <h2 style={{fontSize:'.96rem',fontWeight:800,marginBottom:'1.2rem'}}>Basic Information</h2>
              <div className="g2">
                <F l="Full Name" v={form.name} c={v=>s('name',v)} p="John Doe"/>
                <F l="Phone" v={form.phone} c={v=>s('phone',v)} p="+91 98765 43210"/>
                <F l="Location" v={form.location} c={v=>s('location',v)} p="Delhi, India"/>
              </div>
              <div className="fg"><label>Bio / About Me</label><textarea value={form.bio} onChange={e=>s('bio',e.target.value)} rows={4} placeholder="Brief professional summary..." style={{resize:'vertical'}}/></div>
            </div>)}

            {tab==='professional'&&(<div>
              <h2 style={{fontSize:'.96rem',fontWeight:800,marginBottom:'1.2rem'}}>Professional Details</h2>
              <div className="g2">
                <F l="Current Role" v={form.currentRole} c={v=>s('currentRole',v)} p="Software Engineer"/>
                <F l="Current Company" v={form.currentCompany} c={v=>s('currentCompany',v)} p="Company Name"/>
                <F l="Experience (yrs)" v={form.experience} c={v=>s('experience',v)} t="number" p="2"/>
                <F l="Education" v={form.education} c={v=>s('education',v)} p="B.Tech CS, 2022"/>
                <F l="Expected Salary (₹/yr)" v={form.expectedSalary} c={v=>s('expectedSalary',v)} t="number" p="700000"/>
                <div className="fg"><label>Notice Period</label><select value={form.noticePeriod} onChange={e=>s('noticePeriod',e.target.value)}><option value="">Select...</option>{['Immediate','15 days','30 days','45 days','60 days','90 days'].map(n=><option key={n}>{n}</option>)}</select></div>
              </div>
              <div className="fg">
                <label>Skills (comma separated)</label>
                <input value={form.skills} onChange={e=>s('skills',e.target.value)} placeholder="React, Node.js, Python..."/>
                <div style={{display:'flex',flexWrap:'wrap',gap:'.28rem',marginTop:'.45rem'}}>
                  {ALL_SKILLS.map(sk=>(
                    <button key={sk} type="button" onClick={()=>addSkill(sk)} style={{padding:'.12rem .45rem',borderRadius:100,border:'1px solid var(--border)',background:form.skills.includes(sk)?'rgba(59,130,246,.12)':'transparent',color:form.skills.includes(sk)?'#60a5fa':'var(--text2)',fontSize:'.65rem',cursor:'pointer',transition:'all .15s'}}>
                      {form.skills.includes(sk)?'✓':'+'}  {sk}
                    </button>
                  ))}
                </div>
              </div>
            </div>)}

            {tab==='links'&&(<div>
              <h2 style={{fontSize:'.96rem',fontWeight:800,marginBottom:'.5rem'}}>Social & Portfolio Links</h2>
              <div style={{background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.15)',borderRadius:9,padding:'.8rem',marginBottom:'1rem'}}>
                <div style={{fontSize:'.7rem',fontWeight:700,color:'#60a5fa',marginBottom:'.3rem'}}>🤖 AI Scoring</div>
                <div style={{fontSize:'.74rem',color:'var(--text2)',lineHeight:1.6}}>GitHub + LinkedIn = up to <strong style={{color:'#60a5fa'}}>38 bonus points</strong>. Our AI fetches your actual GitHub repos to verify real work!</div>
              </div>
              <F l="🐙 GitHub Profile URL" v={form.github} c={v=>s('github',v)} p="https://github.com/yourusername"/>
              <F l="💼 LinkedIn Profile URL" v={form.linkedin} c={v=>s('linkedin',v)} p="https://linkedin.com/in/yourname"/>
              <F l="🌐 Portfolio / Website" v={form.portfolio} c={v=>s('portfolio',v)} p="https://yourwebsite.com"/>
            </div>)}

            {tab==='projects'&&(<div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.1rem'}}>
                <h2 style={{fontSize:'.96rem',fontWeight:800}}>My Projects</h2>
                <button type="button" onClick={addProject} className="btn btn-primary btn-sm">+ Add Project</button>
              </div>
              <div style={{background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.15)',borderRadius:9,padding:'.8rem',marginBottom:'1rem'}}>
                <div style={{fontSize:'.74rem',color:'var(--text2)',lineHeight:1.6}}>📂 Projects appear on your profile and are included in your applications. They boost your <strong style={{color:'#60a5fa'}}>Project Score</strong> in AI analysis.</div>
              </div>
              {projects.map((p,idx)=>(
                <div key={idx} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:9,padding:'1.1rem',marginBottom:'.8rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.7rem'}}>
                    <span style={{fontSize:'.78rem',fontWeight:800,color:'var(--text2)'}}>Project {idx+1}</span>
                    {projects.length>1&&<button type="button" onClick={()=>removeProject(idx)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:'.78rem',fontWeight:700}}>✕ Remove</button>}
                  </div>
                  <div className="g2">
                    <F l="Project Name *" v={p.name} c={v=>setP(idx,'name',v)} p="E-Commerce Platform"/>
                    <F l="Tech Stack" v={p.techStack} c={v=>setP(idx,'techStack',v)} p="React, Node.js, MongoDB"/>
                  </div>
                  <F l="Project Link (GitHub / Live Demo)" v={p.link} c={v=>setP(idx,'link',v)} p="https://github.com/you/project"/>
                  <F l="Year" v={p.year} c={v=>setP(idx,'year',v)} p="2024"/>
                  <div className="fg"><label>Description</label><textarea value={p.description} onChange={e=>setP(idx,'description',e.target.value)} rows={2} placeholder="What does this project do? What problem does it solve?" style={{resize:'vertical'}}/></div>
                </div>
              ))}
            </div>)}

            <div style={{marginTop:'1.5rem',paddingTop:'1.1rem',borderTop:'1px solid var(--border)',display:'flex',gap:'.75rem'}}>
              <button onClick={save} className="btn btn-primary btn-lg" disabled={saving}>
                {saving?<><span className="spin"/>Saving...</>:'💾 Save Changes'}
              </button>
              <button onClick={()=>nav('/candidate')} className="btn btn-ghost btn-lg">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const F=({l,v,c,t='text',p=''})=>(<div className="fg"><label>{l}</label><input type={t} value={v} onChange={e=>c(e.target.value)} placeholder={p}/></div>);
