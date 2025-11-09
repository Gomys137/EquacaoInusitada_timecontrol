import { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    } else {
      alert('Preenche todos os campos');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <img src="/logo-e1694443755805.png" alt="Logo" className="login-logo" />

        <label className="login-label">Email</label>
        <input
          type="email"
          className="login-input"
          placeholder="exemplo@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="login-label">Palavra-passe</label>
        <div className="password-input-container">
          <input
            type={showPassword ? "text" : "password"}
            className="login-input password-input"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={togglePasswordVisibility}
          >
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>

        <div className="remember-me-container">
          <label className="remember-me-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="remember-me-checkbox"
            />
            <span className="remember-me-text">Lembrar-me</span>
          </label>
        </div>

        <button type="submit" className="login-button">Entrar</button>
      </form>
    </div>
  );
}