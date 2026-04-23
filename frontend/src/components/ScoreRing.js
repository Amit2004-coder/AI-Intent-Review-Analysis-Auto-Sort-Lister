import React from 'react';
export default function ScoreRing({score=0,size=80,label='',thick=6}){
  const r=size/2-thick;
  const c=2*Math.PI*r;
  const off=c-(score/100)*c;
  const col=score>=75?'#22c55e':score>=50?'#eab308':'#ef4444';
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.28rem'}}>
      <div style={{position:'relative',width:size,height:size}}>
        <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={thick}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={thick}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
            style={{transition:'stroke-dashoffset .9s ease'}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
          fontFamily:'Bricolage Grotesque',fontWeight:800,fontSize:size>70?'1.1rem':'.8rem',color:col}}>
          {score}
        </div>
      </div>
      {label&&<span style={{fontSize:'.63rem',color:'var(--text2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em'}}>{label}</span>}
    </div>
  );
}
