import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

export default function Navbar() {
  const { hrUser, candidate, authMode, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [drop, setDrop] = useState(false);

  if (loc.pathname.startsWith('/apply/')) return null;

  if (!authMode) return (
    <nav style={ns}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
        <Logo />
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
        </div>
      </div>
    </nav>
  );

  const name = authMode === 'hr' ? hrUser?.name : candidate?.name;
  const avatar = authMode === 'hr' ? hrUser?.avatar : candidate?.avatar;
  const avatarSrc = avatar ? `${API}${avatar}` : null;
  const isHR = authMode === 'hr';

  const hrLinks = [
    { to: '/hr', label: 'Dashboard' },
    { to: '/hr/post-job', label: 'Post Job' },
    { to: '/hr/inbox', label: 'Inbox' },
  ];
  const canLinks = [
    { to: '/candidate', label: 'Dashboard' },
    { to: '/candidate/inbox', label: 'Inbox' },
    { to: '/candidate/profile', label: 'My Profile' },
  ];
  const links = isHR ? hrLinks : canLinks;

  return (
    <nav style={ns}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Logo />
          <div style={{ display: 'flex', gap: '.2rem' }}>
            {links.map(l => (
              <Link key={l.to} to={l.to} style={{
                padding: '.38rem .8rem', borderRadius: 7, fontSize: '.82rem', fontWeight: 600,
                color: loc.pathname === l.to ? 'var(--accent)' : 'var(--text2)',
                background: loc.pathname === l.to ? 'rgba(59,130,246,.1)' : 'transparent',
                transition: 'all .15s', textDecoration: 'none',
              }}>{l.label}</Link>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setDrop(!drop)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 9, padding: '.28rem .75rem', cursor: 'pointer' }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.8rem', color: '#fff' }}>{name?.[0]?.toUpperCase()}</div>
            }
            <span style={{ fontSize: '.82rem', fontWeight: 700 }}>{name?.split(' ')[0]}</span>
            <span style={{ fontSize: '.65rem', background: isHR ? 'rgba(59,130,246,.15)' : 'rgba(34,197,94,.15)', color: isHR ? '#60a5fa' : 'var(--green)', border: `1px solid ${isHR ? 'rgba(59,130,246,.3)' : 'rgba(34,197,94,.3)'}`, padding: '.1rem .45rem', borderRadius: 100, fontWeight: 700 }}>
              {isHR ? 'HR' : 'Candidate'}
            </span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {drop && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 7px)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, minWidth: 170, boxShadow: '0 8px 32px rgba(0,0,0,.6)', zIndex: 200, overflow: 'hidden' }} onClick={() => setDrop(false)}>
              <div style={{ padding: '.7rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '.78rem' }}>
                <div style={{ fontWeight: 800 }}>{name}</div>
                <div style={{ color: 'var(--text2)' }}>{isHR ? hrUser?.email : candidate?.email}</div>
              </div>
              {isHR ? (
                <>
                  <NavItem to="/hr" label="🏠 Dashboard" />
                  <NavItem to="/hr/post-job" label="+ Post Job" />
                  <NavItem to="/hr/inbox" label="💬 Inbox" />
                </>
              ) : (
                <>
                  <NavItem to="/candidate" label="🏠 Dashboard" />
                  <NavItem to="/candidate/inbox" label="💬 Inbox" />
                  <NavItem to="/candidate/profile" label="👤 Profile" />
                </>
              )}
              <div style={{ height: 1, background: 'var(--border)' }} />
              <button onClick={() => { logout(); navigate('/login'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '.65rem 1rem', background: 'none', border: 'none', color: 'var(--red)', fontSize: '.82rem', cursor: 'pointer', fontWeight: 600 }}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.55rem', textDecoration: 'none' }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#3b82f6" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
    <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-.02em' }}>AI<span style={{ color: '#3b82f6' }}>Intent</span></span>
  </Link>
);

const NavItem = ({ to, label }) => (
  <Link to={to} style={{ display: 'block', padding: '.6rem 1rem', color: 'var(--text)', fontSize: '.82rem', textDecoration: 'none', fontWeight: 500 }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--card2)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
    {label}
  </Link>
);

const ns = { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,8,17,.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' };
