import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import TimeTracker from '@/components/TimeTracker';
import Calendar from '@/components/Calendar';

export default function FuncionarioDashboard() {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayMarkings, setTodayMarkings] = useState([]);

  useEffect(() => {
    // Simular dados do usuário
    setUser({
      name: "João Silva",
      email: "joao@empresa.com",
      department: "Vendas",
      hourlyRate: 12.50
    });
    
    // Atualizar hora atual a cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleMarking = (type) => {
    const newMarking = {
      id: Date.now(),
      type: type, // 'entrada', 'saida', 'pausa_inicio', 'pausa_fim'
      timestamp: new Date(),
      location: 'IP: 192.168.1.100' // Poderia obter via API
    };
    
    setTodayMarkings(prev => [...prev, newMarking]);
    
    // Aqui enviaria SMS/Email
    sendNotification(newMarking);
  };

  const sendNotification = (marking) => {
    // Simular envio de notificação
    console.log(`Notificação enviada: ${marking.type} às ${marking.timestamp.toLocaleTimeString()}`);
  };

  const calculateTodayHours = () => {
    // Lógica para calcular horas trabalhadas hoje
    return "08:15";
  };

  if (!user) return <div>Carregando...</div>;

  return (
    <Layout user={user} userType="funcionario">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Bem-vindo, {user.name}</h1>
          <div className="current-time">
            {currentTime.toLocaleDateString('pt-PT')} - {currentTime.toLocaleTimeString('pt-PT')}
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Horas Hoje</h3>
            <div className="stat-value">{calculateTodayHours()}</div>
            <span className="stat-label">Horas trabalhadas</span>
          </div>
          
          <div className="stat-card">
            <h3>Esta Semana</h3>
            <div className="stat-value">42:30</div>
            <span className="stat-label">Total semanal</span>
          </div>
          
          <div className="stat-card">
            <h3>Horas Extra</h3>
            <div className="stat-value">02:15</div>
            <span className="stat-label">Este mês</span>
          </div>
          
          <div className="stat-card">
            <h3>Próximo Pagamento</h3>
            <div className="stat-value">5 dias</div>
            <span className="stat-label">Dias restantes</span>
          </div>
        </div>

        {/* Time Tracker */}
        <TimeTracker 
          onMarking={handleMarking}
          todayMarkings={todayMarkings}
          currentTime={currentTime}
        />

        {/* Calendário e Histórico */}
        <div className="dashboard-section">
          <h2>Meu Calendário</h2>
          <Calendar markings={todayMarkings} />
        </div>

        {/* Últimas Marcações */}
        <div className="dashboard-section">
          <h2>Últimas Marcações de Hoje</h2>
          <div className="markings-list">
            {todayMarkings.length === 0 ? (
              <p className="no-markings">Nenhuma marcação hoje</p>
            ) : (
              todayMarkings.map(marking => (
                <div key={marking.id} className="marking-item">
                  <span className={`marking-type ${marking.type}`}>
                    {getMarkingTypeLabel(marking.type)}
                  </span>
                  <span className="marking-time">
                    {marking.timestamp.toLocaleTimeString('pt-PT')}
                  </span>
                  <span className="marking-location">{marking.location}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function getMarkingTypeLabel(type) {
  const labels = {
    entrada: 'Entrada',
    saida: 'Saída',
    pausa_inicio: 'Pausa Início',
    pausa_fim: 'Pausa Fim'
  };
  return labels[type] || type;
}