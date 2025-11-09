import { useState } from 'react';
import Layout from '@/components/Layout';

export default function FuncionariosAdmin() {
  const [user] = useState({
    name: "Administrador", 
    email: "admin@empresa.com",
    department: "Administração"
  });

  return (
    <Layout user={user} userType="admin">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Gestão de Funcionários</h1>
        </div>
        
        <div className="dashboard-section">
          <h2>Lista de Funcionários</h2>
          <div className="no-markings">
            <p>Gestão de funcionários em desenvolvimento</p>
            <small>Brevemente disponível</small>
          </div>
        </div>
      </div>
    </Layout>
  );
}