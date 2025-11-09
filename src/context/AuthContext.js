// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const token = localStorage.getItem('employeeToken') || sessionStorage.getItem('employeeToken');
    if (!token) { setIsLoading(false); return; }

    try {
      const res = await fetch('/api/auth/verify-employee', { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) {
        const emp = JSON.parse(localStorage.getItem('employeeData') || sessionStorage.getItem('employeeData') || 'null');
        setEmployee(emp);
      } else {
        logout();
      }
    } catch (err) { logout(); }
    finally { setIsLoading(false); }
  }

  function login(employeeData, token, remember) {
    setEmployee(employeeData);
    if (remember) {
      localStorage.setItem('employeeToken', token);
      localStorage.setItem('employeeData', JSON.stringify(employeeData));
    } else {
      sessionStorage.setItem('employeeToken', token);
      sessionStorage.setItem('employeeData', JSON.stringify(employeeData));
    }
  }

  function logout() {
    setEmployee(null);
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeData');
    sessionStorage.removeItem('employeeToken');
    sessionStorage.removeItem('employeeData');
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ employee, isLoading, login, logout, isAuthenticated: !!employee }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
