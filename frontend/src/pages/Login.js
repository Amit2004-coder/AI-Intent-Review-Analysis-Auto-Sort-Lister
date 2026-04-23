import React,{useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
import {useAuth} from '../context/AuthContext';

export default function Login(){
  const {hrLogin,candidateLogin}=useAuth();
  const nav=useNavigate();
  const [mode,setMode]=useState('hr'); // 'hr' | 'candidate'
  const [form,setForm]=useState({email:'',password:''});
  const [loading,setLoading]=useState(false);

  const demoFill=(type)=>{
    if(type==='hr'){setMode('hr');setForm({email:'hr@demo.com',password:'demo123'});}
    else{setMode('candidate');setForm({email:'candidate@demo.com',password:'demo123'});}
  };

  const submit=async e=>{
    e.preventDefault();setLoading(true);
    try{
      if(mode==='hr'){ await hrLogin(form.email,form.password); nav('/hr'); }
      else{ await candidateLogin(form.email,form.password); nav('/candidate'); }
      toast.success('Welcome back! 👋');
    }catch(err){ toast.error(err.response?.data?.message||'Login failed'); }
    finally{setLoading(false);}
  };

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',position:'relative',overflow:'hidden'}}>
      {/* Bg glow */}
      <div style={{position:'absolute',top:'-20%',left:'50%',transform:'translateX(-50%)',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,.08) 0%,transparent 70%)',pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:420,position:'relative'}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{width:54,height:54,borderRadius:14,background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto .9rem'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#3b82f6" strokeWidth="2.2" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{fontSize:'1.65rem',fontWeight:800,marginBottom:'.3rem'}}>Sign In</h1>
          <p style={{color:'var(--text2)',fontSize:'.85rem'}}>AI Intent Review — Smart Recruitment</p>
        </div>

        {/* Mode Toggle */}
        <div style={{display:'flex',background:'var(--card)',borderRadius:10,padding:3,border:'1px solid var(--border)',marginBottom:'1.5rem'}}>
          {[{v:'hr',l:'🏢 HR / Recruiter'},{v:'candidate',l:'👤 Job Seeker'}].map(m=>(
            <button key={m.v} onClick={()=>setMode(m.v)} style={{
              flex:1,padding:'.55rem',borderRadius:8,border:'none',cursor:'pointer',fontWeight:700,fontSize:'.82rem',
              background:mode===m.v?'var(--accent)':'transparent',
              color:mode===m.v?'#fff':'var(--text2)',transition:'all .18s',
            }}>{m.l}</button>
          ))}
        </div>

        <div className="card" style={{padding:'1.75rem'}}>
          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'.9rem'}}>
            <div className="fg" style={{marginBottom:0}}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder={mode==='hr'?'hr@company.com':'you@gmail.com'} required/>
            </div>
            <div className="fg" style={{marginBottom:0}}>
              <label>Password</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" required/>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center',marginTop:'.4rem'}} disabled={loading}>
              {loading?<><span className="spin"/>Signing in...</>:'Sign In →'}
            </button>
          </form>

          {/* Demo Buttons */}
          <div style={{marginTop:'1rem',padding:'1rem',background:'var(--bg2)',borderRadius:8,border:'1px solid var(--border)'}}>
            <div style={{fontSize:'.72rem',fontWeight:700,color:'var(--text2)',marginBottom:'.5rem',textTransform:'uppercase',letterSpacing:'.06em'}}>🎯 Demo Accounts</div>
            <div style={{display:'flex',gap:'.5rem'}}>
              <button onClick={()=>demoFill('hr')} className="btn btn-ghost btn-sm" style={{flex:1,justifyContent:'center'}}>HR Demo</button>
              <button onClick={()=>demoFill('candidate')} className="btn btn-ghost btn-sm" style={{flex:1,justifyContent:'center'}}>Candidate Demo</button>
            </div>
          </div>
        </div>

        <p style={{textAlign:'center',marginTop:'1rem',color:'var(--text2)',fontSize:'.82rem'}}>
          No account? <Link to="/register" style={{color:'#60a5fa',fontWeight:700}}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
