import React,{useState,useEffect,useRef} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

const SC={screening:'#7b8fc3',shortlisted:'#22c55e',interview:'#06b6d4',offered:'#eab308',rejected:'#ef4444',applied:'#4a5a7a'};

export default function Inbox(){
  const [threads,setThreads]=useState([]);
  const [loadingThreads,setLoadingThreads]=useState(true);
  const [sel,setSel]=useState(null);
  const [msgs,setMsgs]=useState([]);
  const [newMsg,setNewMsg]=useState('');
  const [sending,setSending]=useState(false);
  const msgEnd=useRef(null);

  const loadThreads=async()=>{
    try{
      const {data}=await axios.get('/api/messages/hr/threads');
      setThreads(data.threads||[]);
    }catch{toast.error('Failed to load inbox');}
    finally{setLoadingThreads(false);}
  };

  useEffect(()=>{loadThreads();},[]);

  const open=async thread=>{
    setSel(thread);
    const {data}=await axios.get('/api/messages/'+thread._id);
    setMsgs(data.messages||[]);
    // mark as read
    await axios.put('/api/messages/mark-read/'+thread._id,{role:'hr'}).catch(()=>{});
    setThreads(ts=>ts.map(t=>t._id===thread._id?{...t,unreadCount:0}:t));
    setTimeout(()=>msgEnd.current?.scrollIntoView({behavior:'smooth'}),100);
  };

  const send=async()=>{
    if(!newMsg.trim()||!sel)return;
    setSending(true);
    try{
      await axios.post('/api/messages/hr',{applicationId:sel._id,text:newMsg.trim()});
      setNewMsg('');
      const {data}=await axios.get('/api/messages/'+sel._id);
      setMsgs(data.messages||[]);
      setTimeout(()=>msgEnd.current?.scrollIntoView({behavior:'smooth'}),100);
    }catch{toast.error('Failed to send');}
    finally{setSending(false);}
  };

  const toggleMessaging=async thread=>{
    try{
      const {data}=await axios.put('/api/messages/hr/toggle-messaging/'+thread._id);
      setThreads(ts=>ts.map(t=>t._id===thread._id?{...t,messagingDisabled:data.messagingDisabled}:t));
      if(sel?._id===thread._id)setSel(s=>({...s,messagingDisabled:data.messagingDisabled}));
      toast.success(data.message);
    }catch{toast.error('Failed to toggle messaging');}
  };

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div className="container" style={{padding:'2rem 1.5rem'}}>
        <div style={{marginBottom:'1.75rem'}}>
          <h1 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'.25rem'}}>💬 Inbox</h1>
          <p style={{color:'var(--text2)',fontSize:'.85rem'}}>Message candidates directly — start conversations and manage replies</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:'1rem',minHeight:540}}>

          {/* Thread list */}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'.85rem 1rem',borderBottom:'1px solid var(--border)',fontWeight:800,fontSize:'.88rem',background:'var(--card2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>Conversations</span>
              <span style={{fontSize:'.72rem',color:'var(--text2)',fontWeight:500}}>{threads.length}</span>
            </div>

            {loadingThreads?(
              <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spin"/></div>
            ):threads.length===0?(
              <div style={{padding:'2rem',textAlign:'center',color:'var(--text2)'}}>
                <div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>💬</div>
                <div style={{fontWeight:700,color:'var(--text)',marginBottom:'.35rem'}}>No conversations yet</div>
                <div style={{fontSize:'.78rem',lineHeight:1.5}}>Open an applicant profile and click "Message" to start a conversation</div>
              </div>
            ):(
              <div style={{overflowY:'auto',maxHeight:500}}>
                {threads.map(t=>(
                  <div key={t._id} onClick={()=>open(t)}
                    style={{padding:'.85rem 1rem',borderBottom:'1px solid var(--border)',cursor:'pointer',
                      background:sel?._id===t._id?'var(--card2)':'transparent',
                      transition:'background .15s',position:'relative'}}>

                    {t.unreadCount>0&&(
                      <div style={{position:'absolute',top:'.7rem',right:'.75rem',width:18,height:18,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.6rem',fontWeight:800,color:'#fff'}}>
                        {t.unreadCount}
                      </div>
                    )}

                    <div style={{display:'flex',gap:'.65rem',alignItems:'flex-start'}}>
                      {/* Avatar */}
                      {t.candidate?.avatar
                        ?<img src={'http://localhost:5000'+t.candidate.avatar} alt="" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
                        :<div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'.9rem',color:'#fff',flexShrink:0}}>
                          {t.fullName?.[0]?.toUpperCase()||'?'}
                        </div>
                      }
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:'.84rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.fullName}</div>
                        <div style={{color:'var(--text2)',fontSize:'.72rem',marginBottom:'.2rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.job?.title}</div>
                        {t.lastMessage&&(
                          <div style={{fontSize:'.72rem',color:t.unreadCount>0?'var(--text)':'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:t.unreadCount>0?600:400}}>
                            {t.lastMessage.senderRole==='hr'?'You: ':'👤 '}{t.lastMessage.text}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{display:'flex',alignItems:'center',gap:'.4rem',marginTop:'.4rem'}}>
                      <span style={{fontSize:'.65rem',fontWeight:700,color:SC[t.status]||'var(--text2)',background:(SC[t.status]||'#7b8fc3')+'18',border:'1px solid '+(SC[t.status]||'#7b8fc3')+'30',padding:'.08rem .4rem',borderRadius:100}}>
                        {t.status}
                      </span>
                      {t.messagingDisabled&&(
                        <span style={{fontSize:'.62rem',color:'var(--red)',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',padding:'.06rem .38rem',borderRadius:100,fontWeight:700}}>
                          🔇 Muted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat area */}
          <div className="card" style={{padding:0,overflow:'hidden',display:'flex',flexDirection:'column'}}>
            {!sel?(
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1rem',color:'var(--text2)',padding:'3rem',textAlign:'center'}}>
                <div style={{fontSize:'3rem'}}>💬</div>
                <div style={{fontSize:'.95rem',fontWeight:700,color:'var(--text)'}}>Select a conversation</div>
                <div style={{fontSize:'.82rem',lineHeight:1.6,maxWidth:300}}>Pick a candidate from the left or start a new conversation from the Applicants page</div>
              </div>
            ):(
              <>
                {/* Chat header */}
                <div style={{padding:'.9rem 1.25rem',borderBottom:'1px solid var(--border)',background:'var(--card2)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'.5rem'}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:'.9rem'}}>{sel.fullName}</div>
                    <div style={{color:'var(--text2)',fontSize:'.75rem'}}>{sel.email} · {sel.job?.title}</div>
                  </div>
                  <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                    <span style={{fontSize:'.72rem',fontWeight:700,color:'#60a5fa'}}>AI Score: {sel.scores?.finalScore||0}%</span>
                    {/* Messaging toggle */}
                    <button onClick={()=>toggleMessaging(sel)}
                      className={'btn btn-sm '+(sel.messagingDisabled?'btn-green':'btn-red')}
                      title={sel.messagingDisabled?'Enable candidate replies':'Disable candidate replies'}>
                      {sel.messagingDisabled?'🔊 Enable Replies':'🔇 Disable Replies'}
                    </button>
                  </div>
                </div>

                {sel.messagingDisabled&&(
                  <div style={{padding:'.6rem 1.25rem',background:'rgba(239,68,68,.06)',borderBottom:'1px solid rgba(239,68,68,.15)',fontSize:'.76rem',color:'var(--red)',display:'flex',alignItems:'center',gap:'.5rem'}}>
                    🔇 Candidate replies are disabled. Click "Enable Replies" to allow them to respond.
                  </div>
                )}

                {/* Messages */}
                <div style={{flex:1,overflowY:'auto',padding:'1.25rem',display:'flex',flexDirection:'column',gap:'.7rem',minHeight:300}}>
                  {msgs.length===0?(
                    <div style={{textAlign:'center',color:'var(--text2)',fontSize:'.82rem',padding:'2rem'}}>
                      No messages yet. Send the first message to start the conversation.
                    </div>
                  ):msgs.map(m=>(
                    <div key={m._id} style={{display:'flex',flexDirection:'column',alignItems:m.senderRole==='hr'?'flex-end':'flex-start'}}>
                      <div style={{fontSize:'.62rem',color:'var(--text3)',marginBottom:'.2rem'}}>
                        {m.senderRole==='hr'?'You':'👤 '+m.senderName} · {new Date(m.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                      </div>
                      <div style={{
                        maxWidth:'75%',padding:'.7rem 1rem',
                        borderRadius:m.senderRole==='hr'?'12px 12px 3px 12px':'12px 12px 12px 3px',
                        background:m.senderRole==='hr'?'var(--accent)':'var(--card2)',
                        border:'1px solid '+(m.senderRole==='hr'?'transparent':'var(--border)'),
                        fontSize:'.84rem',lineHeight:1.55,
                      }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={msgEnd}/>
                </div>

                {/* Input */}
                <div style={{padding:'.85rem 1.1rem',borderTop:'1px solid var(--border)',background:'var(--bg2)',display:'flex',gap:'.6rem'}}>
                  <input value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
                    placeholder="Type message... (Enter to send)"
                    style={{flex:1,padding:'.65rem .95rem',fontSize:'.84rem'}}/>
                  <button onClick={send} className="btn btn-primary" disabled={sending||!newMsg.trim()}>
                    {sending?<span className="spin"/>:'Send →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
