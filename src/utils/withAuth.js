// src/utils/withAuth.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function withAuth(Component, allowedRoles = []) {
  return function ProtectedPage(props) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        try {
          const token = localStorage.getItem('token');
          const userData = localStorage.getItem('user');

          if (!token || !userData) {
            console.warn('🔴 Sem sessão válida, redirecionando...');
            router.replace('/login');
            return;
          }

          const user = JSON.parse(userData);
          const role = (user.role || '').toLowerCase();

          // 🔒 Verifica se o role é permitido
          if (allowedRoles.length && !allowedRoles.includes(role)) {
            console.warn('🔴 Acesso negado, role:', role);
            router.replace('/login');
            return;
          }

          console.log('🟢 Sessão válida:', user.username, '-', role);
          setAuthorized(true);
        } catch (err) {
          console.error('❌ Erro ao validar sessão:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.replace('/login');
        } finally {
          setLoading(false);
        }
      }, 300); // espera 300ms para garantir que o localStorage foi inicializado

      return () => clearTimeout(timer);
    }, [router]);

    if (loading)
      return <p style={{ textAlign: 'center', marginTop: '40px' }}>A validar sessão...</p>;
    if (!authorized) return null;

    return <Component {...props} />;
  };
}
