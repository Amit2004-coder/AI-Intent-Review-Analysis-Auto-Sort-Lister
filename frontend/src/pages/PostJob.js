import React,{useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';

const SKILLS=['React','Node.js','Python','JavaScript','TypeScript','MongoDB','SQL','AWS','Docker','Java','Flutter','Next.js','Vue.js','ML/AI','Data Science','DevOps','Go','PHP','Angular','C++','C#','Swift','Kotlin','Figma'];
const tomorrow=()=>{const d=new Date();d.setDate(d.getDate()+7);return d.toISOString().split('T')[0];};

export default function PostJob(){
  const nav=useNavigate();
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [link,setLink]=useState('');
  const [form,setForm]=useState({
    title:'',company:'',location:'',jobType:'Full-time',workMode:'Remote',category:'Technology',
    openings:1,description:'',requirements:'',responsibilities:'',
    skills:'',experienceMin:0,experienceMax:5,
    salaryMin:'',salaryMax:'',salaryVisible:true,linkExpiry:tomorrow(),
  });
  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  const addSkill=sk=>{const cur=form.skills.split(',').map(x=>x.trim()).filter(Boolean);if(!cur.includes(sk))s('skills',[...cur,sk].join(', '));};

  const submit=async()=>{
    if(!form.title||!form.company||!form.description){toast.error('Fill title, company, description');return;}
    setLoading(true);
    try{
      const {data}=await axios.post('/api/jobs',{...form,skills:form.skills.split(',').map(x=>x.trim()).filter(Boolean)});
      setLink(data.applyLink);setStep(4);
      toast.success('Job posted! 🎉');
    }catch(e){toast.error(e.response?.data?.message||'Failed');}
    finally{setLoading(false);}
  };

  if(step===4) return(
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
      <div style={{maxWidth:560,width:'100%',textAlign:'center'}}>
        <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🎉</div>
        <h1 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'.75rem'}}>Job Posted!</h1>
        <p style={{color:'var(--text2)',marginBottom:'2rem'}}>Share this unique AI-screening link. All applicants will be auto-ranked.</p>
        <div className="card" style={{marginBottom:'1.5rem',textAlign:'left'}}>
          <div style={{fontSize:'.72rem',fontWeight:700,color:'var(--text2)',marginBottom:'.5rem',textTransform:'uppercase'}}>Application Link</div>
          <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
            <code className="mono" style={{flex:1,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:'.7rem 1rem',fontSize:'.78rem',color:'#60a5fa',wordBreak:'break-all',lineHeight:1.5}}>{link}</code>
            <button onClick={()=>{navigator.clipboard.writeText(link);toast.success('Copied!');}} className="btn btn-primary" style={{flexShrink:0}}>📋</button>
          </div>
          <div style={{fontSize:'.72rem',color:'var(--text3)',marginTop:'.5rem'}}>⏰ Expires: {new Date(form.linkExpiry).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <div style={{display:'flex',gap:'.75rem',justifyContent:'center'}}>
          <button onClick={()=>nav('/hr')} className="btn btn-ghost btn-lg">← Dashboard</button>
          <button onClick={()=>{setStep(1);setLink('');setForm(f=>({...f,title:'',description:''}));}} className="btn btn-primary btn-lg">Post Another</button>
        </div>
      </div>
    </div>
  );

  const stepNames=['Basic Info','Job Details','Skills & Salary'];
  const pct=((step-1)/2)*100;

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',padding:'2rem 0'}}>
      <div className="container" style={{maxWidth:700}}>
        <button onClick={()=>nav('/hr')} style={{background:'none',border:'none',color:'var(--text2)',cursor:'pointer',fontSize:'.82rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'.3rem'}}>← Back</button>
        <h1 style={{fontSize:'1.75rem',fontWeight:800,marginBottom:'.4rem'}}>Post a New Job</h1>
        <p style={{color:'var(--text2)',fontSize:'.85rem',marginBottom:'2rem'}}>A unique AI-screening link will be generated automatically</p>

        {/* Steps */}
        <div style={{display:'flex',gap:0,marginBottom:'2rem',background:'var(--card)',borderRadius:10,padding:3,border:'1px solid var(--border)'}}>
          {stepNames.map((n,i)=>(
            <button key={i} onClick={()=>i+1<step&&setStep(i+1)} style={{
              flex:1,padding:'.55rem .4rem',borderRadius:8,border:'none',cursor:i+1<step?'pointer':'default',
              background:step===i+1?'var(--accent)':'transparent',
              color:step===i+1?'#fff':step>i+1?'var(--green)':'var(--text2)',
              fontWeight:700,fontSize:'.78rem',transition:'all .18s',
            }}>{step>i+1?'✓ ':''}{i+1}. {n}</button>
          ))}
        </div>

        {/* Step 1 */}
        {step===1&&(
          <div className="card fu">
            <h2 style={{fontSize:'1rem',fontWeight:800,marginBottom:'1.25rem'}}>📋 Basic Information</h2>
            <div className="g2">
              <F l="Job Title *" v={form.title} c={v=>s('title',v)} p="Senior React Developer"/>
              <F l="Company *" v={form.company} c={v=>s('company',v)} p="Your Company Ltd"/>
              <F l="Location" v={form.location} c={v=>s('location',v)} p="Delhi / Remote"/>
              <Sel l="Category" v={form.category} c={v=>s('category',v)} opts={['Technology','Design','Marketing','Finance','HR','Sales','Data Science','Other']}/>
              <Sel l="Job Type" v={form.jobType} c={v=>s('jobType',v)} opts={['Full-time','Part-time','Contract','Internship','Freelance']}/>
              <Sel l="Work Mode" v={form.workMode} c={v=>s('workMode',v)} opts={['Remote','On-site','Hybrid']}/>
              <F l="Total Openings" v={form.openings} c={v=>s('openings',v)} t="number" p="5"/>
              <div className="fg">
                <label>⏰ Link Expiry Date *</label>
                <input type="date" value={form.linkExpiry} min={new Date().toISOString().split('T')[0]} onChange={e=>s('linkExpiry',e.target.value)}/>
                <div style={{fontSize:'.7rem',color:'var(--text3)',marginTop:'.3rem'}}>After this date, candidates cannot apply</div>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'1rem'}}>
              <button onClick={()=>{if(!form.title||!form.company){toast.error('Title & company required');return;}setStep(2);}} className="btn btn-primary btn-lg">Next →</button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step===2&&(
          <div className="card fu">
            <h2 style={{fontSize:'1rem',fontWeight:800,marginBottom:'1.25rem'}}>📝 Job Details</h2>
            <div className="fg"><label>Description *</label><textarea value={form.description} onChange={e=>s('description',e.target.value)} rows={5} placeholder="Describe the role, team, and what success looks like..." style={{resize:'vertical'}}/></div>
            <div className="fg"><label>Requirements</label><textarea value={form.requirements} onChange={e=>s('requirements',e.target.value)} rows={4} placeholder="Education, certifications, must-have..." style={{resize:'vertical'}}/></div>
            <div className="fg"><label>Responsibilities</label><textarea value={form.responsibilities} onChange={e=>s('responsibilities',e.target.value)} rows={4} placeholder="Day-to-day tasks..." style={{resize:'vertical'}}/></div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'1rem'}}>
              <button onClick={()=>setStep(1)} className="btn btn-ghost btn-lg">← Back</button>
              <button onClick={()=>{if(!form.description){toast.error('Description required');return;}setStep(3);}} className="btn btn-primary btn-lg">Next →</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step===3&&(
          <div className="card fu">
            <h2 style={{fontSize:'1rem',fontWeight:800,marginBottom:'1.25rem'}}>🛠️ Skills, Experience & Salary</h2>
            <div className="fg">
              <label>Required Skills (comma separated)</label>
              <input value={form.skills} onChange={e=>s('skills',e.target.value)} placeholder="React, Node.js, Python..."/>
              <div style={{display:'flex',flexWrap:'wrap',gap:'.3rem',marginTop:'.5rem'}}>
                {SKILLS.map(sk=>(
                  <button key={sk} type="button" onClick={()=>addSkill(sk)} style={{
                    padding:'.15rem .5rem',borderRadius:100,border:'1px solid var(--border)',
                    background:form.skills.includes(sk)?'rgba(59,130,246,.15)':'transparent',
                    color:form.skills.includes(sk)?'#60a5fa':'var(--text2)',fontSize:'.68rem',cursor:'pointer',transition:'all .15s',
                  }}>{form.skills.includes(sk)?'✓':'+'}  {sk}</button>
                ))}
              </div>
            </div>
            <div className="g2">
              <F l="Min Exp (years)" v={form.experienceMin} c={v=>s('experienceMin',v)} t="number" p="0"/>
              <F l="Max Exp (years)" v={form.experienceMax} c={v=>s('experienceMax',v)} t="number" p="5"/>
              <F l="Min Salary (₹/yr)" v={form.salaryMin} c={v=>s('salaryMin',v)} t="number" p="400000"/>
              <F l="Max Salary (₹/yr)" v={form.salaryMax} c={v=>s('salaryMax',v)} t="number" p="900000"/>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:'.5rem',cursor:'pointer',fontSize:'.82rem',color:'var(--text2)',marginTop:'.5rem'}}>
              <input type="checkbox" checked={form.salaryVisible} onChange={e=>s('salaryVisible',e.target.checked)} style={{width:'auto'}}/>
              Show salary to candidates
            </label>
            {/* Summary */}
            <div style={{marginTop:'1.25rem',padding:'1rem',background:'var(--bg2)',borderRadius:10,border:'1px solid var(--border)'}}>
              <div style={{fontSize:'.72rem',fontWeight:700,color:'var(--text2)',marginBottom:'.6rem',textTransform:'uppercase'}}>Review</div>
              <div className="g2" style={{gap:'.4rem'}}>
                {[['Title',form.title],['Company',form.company],['Type',`${form.jobType} · ${form.workMode}`],['Exp',`${form.experienceMin}–${form.experienceMax} yrs`],['Expires',new Date(form.linkExpiry).toLocaleDateString()]].map(([k,v])=>(
                  <div key={k}><div style={{fontSize:'.65rem',color:'var(--text3)',fontWeight:700,textTransform:'uppercase'}}>{k}</div><div style={{fontSize:'.82rem',fontWeight:700}}>{v||'—'}</div></div>
                ))}
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'1.25rem'}}>
              <button onClick={()=>setStep(2)} className="btn btn-ghost btn-lg">← Back</button>
              <button onClick={submit} className="btn btn-primary btn-lg" disabled={loading}>
                {loading?<><span className="spin"/>Posting...</>:'🚀 Post & Get Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
const F=({l,v,c,t='text',p=''})=>(<div className="fg"><label>{l}</label><input type={t} value={v} onChange={e=>c(e.target.value)} placeholder={p}/></div>);
const Sel=({l,v,c,opts})=>(<div className="fg"><label>{l}</label><select value={v} onChange={e=>c(e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select></div>);
