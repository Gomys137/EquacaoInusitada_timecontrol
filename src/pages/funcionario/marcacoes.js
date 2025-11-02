import { useState } from 'react';
import Layout from '@/components/Layout';

export default function Marcacoes() {
  const [user] = useState({
    name: "João Silva",
    email: "joao@empresa.com", 
    department: "Vendas"
  });

  return (
    <Layout user={user} userType="funcionario">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Minhas Marcações</h1>
        </div>
        
        <div className="dashboard-section">
          <h2>Histórico de Marcações</h2>
          <div className="no-markings">
            <p>Funcionalidade em desenvolvimento</p>
            <small>Brevemente disponível</small>
          </div>
        </div>
      </div>
    </Layout>
  );
}