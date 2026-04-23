import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const SC = { screening: '#7b8fc3', shortlisted: '#22c55e', interview: '#06b6d4', offered: '#eab308', rejected: '#ef4444', applied: '#4a5a7a' };

export default function CandidateInbox() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [msgDisabled, setMsgDisabled] = useState(false);
  const [sending, setSending] = useState(false);
  const msgEnd = useRef(null);

  const loadThreads = async () => {
    try {
      const { data } = await axios.get('/api/messages/candidate/inbox');
      setThreads(data.threads || []);
    } catch { toast.error('Failed to load inbox'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadThreads(); }, []);

  const openThread = async (thread) => {
    setSel(thread);
    try {
      const { data } = await axios.get(`/api/messages/${thread._id}`);
      setMsgs(data.messages || []);
      setMsgDisabled(data.messagingDisabled || false);
      // Mark HR messages as read
      await axios.put(`/api/messages/mark-read/${thread._id}`, { role: 'candidate' }).catch(() => {});
      setTimeout(() => msgEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      // Update unread count in thread list
      setThreads(ts => ts.map(t => t._id === thread._id ? { ...t, unreadCount: 0 } : t));
    } catch { toast.error('Failed to load messages'); }
  };

  const send = async () => {
    if (!newMsg.trim() || !sel) return;
    setSending(true);
    try {
      await axios.post('/api/messages/candidate', { applicationId: sel._id, text: newMsg.trim() });
      setNewMsg('');
      const { data } = await axios.get(`/api/messages/${sel._id}`);
      setMsgs(data.messages || []);
      setTimeout(() => msgEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to send';
      toast.error(msg);
      if (e.response?.data?.messagingDisabled) setMsgDisabled(true);
    } finally { setSending(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.25rem' }}>💬 Inbox</h1>
          <p style={{ color: 'var(--text2)', fontSize: '.85rem' }}>Messages from HR teams — you can reply to conversations started by them</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem', minHeight: 520 }}>
          {/* Thread list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '.85rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: '.88rem', background: 'var(--card2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Conversations</span>
              <span style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 500 }}>{threads.length} thread{threads.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spin" /></div>
            ) : threads.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📭</div>
                <div style={{ fontWeight: 700, marginBottom: '.35rem', color: 'var(--text)' }}>No messages yet</div>
                <div style={{ fontSize: '.78rem', lineHeight: 1.5 }}>HR will message you here when they're interested in your application</div>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: 480 }}>
                {threads.map(t => (
                  <div key={t._id} onClick={() => openThread(t)}
                    style={{ padding: '.85rem 1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: sel?._id === t._id ? 'var(--card2)' : 'transparent', transition: 'background .15s', position: 'relative' }}>
                    {/* Unread badge */}
                    {t.unreadCount > 0 && (
                      <div style={{ position: 'absolute', top: '.7rem', right: '.75rem', width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 800, color: '#fff' }}>
                        {t.unreadCount}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.9rem', color: '#fff', flexShrink: 0 }}>
                        {t.job?.company?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.job?.title}</div>
                        <div style={{ color: 'var(--text2)', fontSize: '.72rem', marginBottom: '.2rem' }}>{t.job?.company}</div>
                        {t.lastMessage && (
                          <div style={{ fontSize: '.72rem', color: t.unreadCount > 0 ? 'var(--text)' : 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: t.unreadCount > 0 ? 600 : 400 }}>
                            {t.lastMessage.senderRole === 'hr' ? '🏢 HR: ' : 'You: '}{t.lastMessage.text}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.4rem' }}>
                      <span style={{ fontSize: '.65rem', fontWeight: 700, color: SC[t.status] || 'var(--text2)', background: `${SC[t.status] || '#7b8fc3'}18`, border: `1px solid ${SC[t.status] || '#7b8fc3'}30`, padding: '.08rem .4rem', borderRadius: 100 }}>
                        {t.status}
                      </span>
                      {t.messagingDisabled && (
                        <span style={{ fontSize: '.62rem', color: 'var(--red)', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', padding: '.06rem .38rem', borderRadius: 100, fontWeight: 700 }}>
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
          <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {!sel ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text2)', padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem' }}>💬</div>
                <div style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>Select a conversation</div>
                <div style={{ fontSize: '.82rem', lineHeight: 1.6, maxWidth: 300 }}>Choose a conversation from the left panel to read and reply to HR messages</div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{ padding: '.9rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--card2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '.92rem' }}>{sel.job?.title}</div>
                    <div style={{ color: 'var(--text2)', fontSize: '.75rem' }}>{sel.job?.company} · {sel.job?.location}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    {msgDisabled && (
                      <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--red)', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', padding: '.25rem .65rem', borderRadius: 100 }}>
                        🔇 Replies Disabled
                      </span>
                    )}
                    <span style={{ fontSize: '.72rem', fontWeight: 700, color: SC[sel.status] || 'var(--text2)', background: `${SC[sel.status] || '#7b8fc3'}18`, border: `1px solid ${SC[sel.status] || '#7b8fc3'}30`, padding: '.25rem .65rem', borderRadius: 100 }}>
                      {sel.status}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.7rem', minHeight: 300 }}>
                  {/* Intro notice */}
                  <div style={{ textAlign: 'center', padding: '.5rem 1rem', background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: 8, fontSize: '.74rem', color: 'var(--text2)' }}>
                    💡 You can only reply to messages. HR initiates conversations.
                  </div>

                  {msgs.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '.82rem', padding: '2rem' }}>No messages yet</div>
                  ) : msgs.map(m => (
                    <div key={m._id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.senderRole === 'candidate' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ fontSize: '.62rem', color: 'var(--text3)', marginBottom: '.2rem' }}>
                        {m.senderRole === 'hr' ? '🏢 ' : '👤 '}{m.senderName} · {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                      <div style={{
                        maxWidth: '76%', padding: '.65rem .95rem',
                        borderRadius: m.senderRole === 'candidate' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                        background: m.senderRole === 'candidate' ? 'var(--accent)' : 'var(--card2)',
                        border: `1px solid ${m.senderRole === 'candidate' ? 'transparent' : 'var(--border)'}`,
                        fontSize: '.84rem', lineHeight: 1.55,
                      }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={msgEnd} />
                </div>

                {/* Input area */}
                <div style={{ padding: '.85rem 1.1rem', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
                  {msgDisabled ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 9 }}>
                      <span style={{ fontSize: '1.2rem' }}>🔇</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.82rem', color: 'var(--red)' }}>Replies Disabled</div>
                        <div style={{ fontSize: '.74rem', color: 'var(--text2)' }}>HR has disabled messaging for this application. You cannot reply at this time.</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '.6rem' }}>
                      <input
                        value={newMsg}
                        onChange={e => setNewMsg(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                        placeholder="Type your reply… (Enter to send)"
                        style={{ flex: 1, padding: '.65rem .95rem', fontSize: '.84rem' }}
                      />
                      <button onClick={send} className="btn btn-primary" disabled={sending || !newMsg.trim()}>
                        {sending ? <span className="spin" /> : 'Reply →'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
