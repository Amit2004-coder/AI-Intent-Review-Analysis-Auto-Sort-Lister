import React from 'react';
import {Link} from 'react-router-dom';
export default function NotFound(){
  return(
    <div style={{minHeight:'80vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'2rem'}}>
      <div style={{fontFamily:'Bricolage Grotesque',fontSize:'6rem',fontWeight:800,color:'var(--border2)',lineHeight:1}}>404</div>
      <h1 style={{fontSize:'1.5rem',fontWeight:800,margin:'1rem 0 .5rem'}}>Page Not Found</h1>
      <p style={{color:'var(--text2)',marginBottom:'2rem',fontSize:'.88rem'}}>This page doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
}
