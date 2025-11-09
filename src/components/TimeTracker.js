import { useState, useEffect } from 'react';

export default function TimeTracker({ onMarking, todayMarkings, currentTime }) {
  const [currentStatus, setCurrentStatus] = useState('fora');
  
  useEffect(() => {
    const lastMarking = todayMarkings[todayMarkings.length - 1];
    if (lastMarking) {
      setCurrentStatus(lastMarking.type);
    }
  }, [todayMarkings]);

  const getNextAction = () => {
    const lastMarking = todayMarkings[todayMarkings.length - 1];
    
    if (!lastMarking) return 'entrada';
    if (lastMarking.type === 'entrada') return 'saida';
    return 'entrada'; // Alterna entre entrada e saida
  };

  const handleAction = () => {
    const nextAction = getNextAction();
    onMarking(nextAction);
  };

  const getButtonConfig = () => {
    const configs = {
      entrada: {
        text: 'Iniciar Trabalho',
        icon: 'fa-play-circle',
        color: 'var(--e-global-color-cbda211)',
        bgColor: 'var(--e-global-color-cbda211)'
      },
      saida: {
        text: 'Terminar Trabalho',
        icon: 'fa-stop-circle',
        color: 'var(--e-global-color-cbda211)',
        bgColor: 'var(--e-global-color-cbda211)'
      }
    };
    return configs[getNextAction()] || { 
      text: 'Iniciar Trabalho', 
      icon: 'fa-play-circle', 
      color: 'var(--e-global-color-cbda211)',
      bgColor: 'var(--e-global-color-cbda211)'
    };
  };

  const getStatusConfig = () => {
    const configs = {
      entrada: { 
        text: 'A Trabalhar', 
        icon: 'fa-building', 
        color: 'var(--e-global-color-cbda211)' 
      },
      saida: { 
        text: 'Fora do Trabalho', 
        icon: 'fa-home', 
        color: '#6c757d' 
      },
      fora: { 
        text: 'Fora do Trabalho', 
        icon: 'fa-home', 
        color: '#6c757d' 
      }
    };
    return configs[currentStatus] || configs.fora;
  };

  const buttonConfig = getButtonConfig();
  const statusConfig = getStatusConfig();

  return (
    <div className="time-tracker">
      {/* Header com Status */}
      <div className="tracker-header">
        <div className="header-main">
          <div className="header-icon">
            <i className={`fas fa-clock`}></i>
          </div>
          <div className="header-info">
            <h2>Controlo de Tempo</h2>
            <div className="current-time-display">
              <i className="fas fa-clock"></i>
              {currentTime.toLocaleTimeString('pt-PT')}
            </div>
          </div>
        </div>
        
        <div className="status-indicator">
          <div className="status-badge" style={{ backgroundColor: statusConfig.color }}>
            <i className={`fas ${statusConfig.icon}`}></i>
            <span>{statusConfig.text}</span>
          </div>
        </div>
      </div>
      
      {/* Botão Principal de Ação */}
      <div className="tracker-body">
        <button 
          className="mark-button"
          onClick={handleAction}
          style={{ 
            backgroundColor: buttonConfig.bgColor,
            '--button-hover': `${buttonConfig.bgColor}dd`
          }}
        >
          <div className="button-content">
            <div className="button-icon">
              <i className={`fas ${buttonConfig.icon}`}></i>
            </div>
            <div className="button-text">
              <span className="button-main-text">{buttonConfig.text}</span>
              <span className="button-sub-text">Clique para registar</span>
            </div>
          </div>
        </button>
      </div>
      
      {/* Última Marcação */}
      {todayMarkings.length > 0 && (
        <div className="last-marking">
          <div className="last-marking-header">
            <i className="fas fa-history"></i>
            <span>Última Marcação</span>
          </div>
          <div className="last-marking-content">
            <span className="marking-type">
              {todayMarkings[todayMarkings.length - 1].type === 'entrada' ? 'Início' : 'Término'}
            </span>
            <span className="marking-time">
              {todayMarkings[todayMarkings.length - 1].timestamp.toLocaleTimeString('pt-PT')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}