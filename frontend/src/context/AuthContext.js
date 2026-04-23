import React,{createContext,useContext,useState,useEffect,useCallback} from 'react';
import axios from 'axios';

const Ctx = createContext();
axios.defaults.baseURL = 'http://localhost:5000';

export function AuthProvider({children}){
  const [hrUser, setHrUser]         = useState(null);
  const [candidate, setCandidate]   = useState(null);
  const [authMode, setAuthMode]     = useState(null); // 'hr' | 'candidate'
  const [loading, setLoading]       = useState(true);

  const setAxiosToken = (token) => {
    if(token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(()=>{
    const hrToken  = localStorage.getItem('air_hr_token');
    const canToken = localStorage.getItem('air_can_token');
    if(hrToken){
      setAxiosToken(hrToken);
      axios.get('/api/auth/me').then(r=>{ setHrUser(r.data.user); setAuthMode('hr'); })
        .catch(()=>{ localStorage.removeItem('air_hr_token'); })
        .finally(()=>setLoading(false));
    } else if(canToken){
      setAxiosToken(canToken);
      axios.get('/api/candidate/me').then(r=>{ setCandidate(r.data.candidate); setAuthMode('candidate'); })
        .catch(()=>{ localStorage.removeItem('air_can_token'); })
        .finally(()=>setLoading(false));
    } else { setLoading(false); }
  },[]);

  const hrLogin = async(email,pw)=>{
    const {data}=await axios.post('/api/auth/login',{email,password:pw});
    localStorage.setItem('air_hr_token',data.token);
    setAxiosToken(data.token);
    setHrUser(data.user); setAuthMode('hr');
    return data;
  };
  const hrRegister = async(payload)=>{
    const {data}=await axios.post('/api/auth/register',payload);
    localStorage.setItem('air_hr_token',data.token);
    setAxiosToken(data.token);
    setHrUser(data.user); setAuthMode('hr');
    return data;
  };
  const candidateLogin = async(email,pw)=>{
    const {data}=await axios.post('/api/candidate/login',{email,password:pw});
    localStorage.setItem('air_can_token',data.token);
    setAxiosToken(data.token);
    setCandidate(data.candidate); setAuthMode('candidate');
    return data;
  };
  const candidateRegister = async(payload)=>{
    const {data}=await axios.post('/api/candidate/register',payload);
    localStorage.setItem('air_can_token',data.token);
    setAxiosToken(data.token);
    setCandidate(data.candidate); setAuthMode('candidate');
    return data;
  };
  const logout = ()=>{
    localStorage.removeItem('air_hr_token');
    localStorage.removeItem('air_can_token');
    setAxiosToken(null);
    setHrUser(null); setCandidate(null); setAuthMode(null);
  };
  const updateCandidate = c => setCandidate(c);
  const updateHr = u => setHrUser(u);

  return(
    <Ctx.Provider value={{hrUser,candidate,authMode,loading,hrLogin,hrRegister,candidateLogin,candidateRegister,logout,updateCandidate,updateHr}}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = ()=>useContext(Ctx);
