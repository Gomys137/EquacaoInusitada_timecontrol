// components/Layout.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Layout({ children, user, userType }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('rememberMe');
    router.push('/');
  };

  return (
    <div className="layout">
      {/* Sidebar Elegante */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="company-brand">
            <div className="logo-container">
              <Image 
                src="/logo-e1694443755805.png" 
                alt="Equação Inusitada" 
                width={40} 
                height={40}
                className="sidebar-logo"
              />
            </div>
            <div className="company-info">
              <h3>Equação Inusitada</h3>
              <span>Sistema de Gestão</span>
            </div>
          </div>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar">
            <i className="fas fa-user"></i>
          </div>
          <div className="user-details">
            <strong>{user?.name}</strong>
            <span>{user?.department}</span>
            <small>{userType === 'admin' ? 'Administrador' : 'Funcionário'}</small>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="sidebar-nav">
          <Link href="/funcionario/dashboard" className="nav-item active">
            <div className="nav-icon">
              <i className="fas fa-home"></i>
            </div>
            <span>Dashboard</span>
            <div className="nav-indicator"></div>
          </Link>
          
          <Link href="/funcionario/marcacoes" className="nav-item">
            <div className="nav-icon">
              <i className="fas fa-clock"></i>
            </div>
            <span>Minhas Marcações</span>
          </Link>
          
          <Link href="/funcionario/relatorios" className="nav-item">
            <div className="nav-icon">
              <i className="fas fa-chart-bar"></i>
            </div>
            <span>Relatórios</span>
          </Link>
          
          <Link href="/funcionario/calendario" className="nav-item">
            <div className="nav-icon">
              <i className="fas fa-calendar"></i>
            </div>
            <span>Calendário</span>
          </Link>
          
          <Link href="/funcionario/configuracoes" className="nav-item">
            <div className="nav-icon">
              <i className="fas fa-cog"></i>
            </div>
            <span>Configurações</span>
          </Link>
        </nav>
        
        {/* Footer */}
        <div className="sidebar-footer">
          <div className="support-info">
            <i className="fas fa-headset"></i>
            <div>
              <strong>Suporte</strong>
              <span>(+351) 926 999 638</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            <span>Terminar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className="breadcrumb">
              <span>Dashboard</span>
              <i className="fas fa-chevron-right"></i>
              <span>Principal</span>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="header-btn notification-btn">
              <i className="fas fa-bell"></i>
              <span className="notification-badge">3</span>
            </button>
            
            <button className="header-btn help-btn">
              <i className="fas fa-question-circle"></i>
            </button>
            
            <div className="user-menu">
              <div className="user-greeting">
                <span>Olá, {user?.name}</span>
                <small>Bem-vindo de volta!</small>
              </div>
              <div className="user-avatar-sm">
                <i className="fas fa-user"></i>
              </div>
            </div>
          </div>
        </header>

        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}