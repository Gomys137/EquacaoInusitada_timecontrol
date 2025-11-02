import { useState } from 'react';
import Layout from '@/components/Layout';

export default function AdminDashboard() {
  const [user] = useState({
    name: "Administrador",
    email: "admin@empresa.com",
    department: "Administração"
  });

  return (
    <Layout user={user} userType="admin">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Painel Administrativo</h1>
        </div>
        
        <div className="dashboard-section">
          <h2>Visão Geral</h2>
          <div className="no-markings">
            <p>Painel administrativo em desenvolvimento</p>
            <small>Brevemente disponível</small>
          </div>
        </div>
      </div>
    </Layout>
  );
}