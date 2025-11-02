import Login from '@/components/Login';

export default function LoginPage() {
  const handleLogin = (email) => {
    console.log('Utilizador autenticado:', email);
  };

  return <Login onLogin={handleLogin} />;
}