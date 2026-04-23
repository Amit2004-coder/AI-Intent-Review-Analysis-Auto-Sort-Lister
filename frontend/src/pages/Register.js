import React,{useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
import {useAuth} from '../context/AuthContext';

export default function Register(){
  const {hrRegister,candidateRegister}=useAuth();
  const nav=useNavigate();
  const [mode,setMode]=useState('hr');
  const [form,setForm]=useState({name:'',email:'',password:'',company:''});
  const [loading,setLoading]=useState(false);

  const submit=async e=>{
    e.preventDefault();
    if(form.password.length<6){toast.error('Password min 6 characters');return;}
    setLoading(true);
    try{
      if(mode==='hr'){await hrRegister({name:form.name,email:form.email,password:form.password,company:form.company});nav('/hr');}
      else{await candidateRegister({name:form.name,email:form.email,password:form.password});nav('/candidate');}
      toast.success('Account created! Welcome 🎉');
    }catch(err){toast.error(err.response?.data?.message||'Registration failed');}
    finally{setLoading(false);}
  };

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'-10%',right:'-10%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{width:'100%',maxWidth:440,position:'relative'}}>
        <div style={{textAlign:'center',marginBottom:'1.75rem'}}>
          <h1 style={{fontSize:'1.65rem',fontWeight:800,marginBottom:'.3rem'}}>Create Account</h1>
          <p style={{color:'var(--text2)',fontSize:'.85rem'}}>Join AI Intent Review today</p>
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
              <label>Full Name</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="John Doe" required/>
            </div>
            <div className="fg" style={{marginBottom:0}}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" required/>
            </div>
            {mode==='hr'&&(
              <div className="fg" style={{marginBottom:0}}>
                <label>Company Name</label>
                <input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Your Company Ltd"/>
              </div>
            )}
            <div className="fg" style={{marginBottom:0}}>
              <label>Password</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 6 characters" required/>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center',marginTop:'.4rem'}} disabled={loading}>
              {loading?<><span className="spin"/>Creating...</>:`Create ${mode==='hr'?'HR':'Candidate'} Account →`}
            </button>
          </form>
        </div>
        <p style={{textAlign:'center',marginTop:'1rem',color:'var(--text2)',fontSize:'.82rem'}}>
          Already have account? <Link to="/login" style={{color:'#60a5fa',fontWeight:700}}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
