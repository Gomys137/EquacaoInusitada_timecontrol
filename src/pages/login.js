import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // ✅ agora envia username
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Credenciais inválidas');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const role = data.user.role?.toLowerCase() || 'employee';
      console.log('✅ Login OK - role:', role);

      if (role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/funcionario/dashboard';
      }
    } catch (err) {
      console.error('❌ Erro no login:', err);
      setError('Erro na autenticação. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        {/* Header */}
        <div style={styles.header}>
          <img src="/logo-e1694443755805.png" alt="Logo" style={styles.logo} />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Utilizador</label>
            <input
              type="text"
              placeholder="Nome de utilizador"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Palavra-passe</label>
            <input
              type="password"
              placeholder="**********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>

          {/* Remember Me */}
          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={styles.checkbox}
              disabled={loading}
            />
            <label htmlFor="rememberMe" style={styles.checkboxLabel}>
              Lembrar-me
            </label>
          </div>

          {error && (
            <div style={styles.errorAlert}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={styles.errorIcon}
              >
                <path
                  d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonLoading : {}),
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor =
                  styles.buttonHover.backgroundColor;
                e.target.style.color = styles.buttonHover.color; // muda a cor da letra no hover
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor =
                  styles.button.backgroundColor;
                e.target.style.color = styles.button.color; // volta à cor original
              }
            }}
          >
            {loading ? (
              <>
                <div style={styles.spinner}></div>
                A autenticar...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2072ac',
    padding: '1rem',
    fontFamily: 'Arial, sans-serif',
  },
  loginCard: {
    backgroundColor: '#ffffff',
    padding: '2rem 1.5rem',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    width: '100%',
    maxWidth: '400px',
    border: 'none',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logo: {
    width: '135px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#2072ac',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '0.75rem 0rem',
    border: 'none',
    borderBottom: '2px solid #2072ac',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#333333',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '-0.5rem',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#2072ac',
  },
  checkboxLabel: {
    fontSize: '0.875rem',
    color: '#2072ac',
    cursor: 'pointer',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#fff5f5',
    color: '#c53030',
    borderRadius: '4px',
    fontSize: '0.875rem',
    border: '1px solid #fed7d7',
  },
  errorIcon: {
    flexShrink: 0,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: '#F3C80B',
    color: '#2072ac',
    border: 'none',
    padding: '1rem 1.5rem',
    borderRadius: '15px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    width: '100%',
  },
  buttonHover: {
    backgroundColor: '#2B416A',
    color: '#ffffff', // ✅ texto branco no hover
  },
  buttonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
    backgroundColor: '#cccccc',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid #2072ac',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Estilo global do spinner
const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

input:focus {
  border-bottom-color: #F3C80B !important;
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = spinnerStyle;
  document.head.appendChild(styleSheet);
}

