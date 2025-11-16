import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import withAuth from '../../utils/withAuth';

function DashboardFuncionario() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayMarkings, setTodayMarkings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewDay, setIsNewDay] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) loadMarkings();
  }, [user]);

  // Verifica se é um novo dia
  useEffect(() => {
    const checkNewDay = () => {
      const now = new Date();
      const lastMarking = todayMarkings[todayMarkings.length - 1];

      if (!lastMarking) {
        setIsNewDay(true);
        return;
      }

      const lastMarkingDate = new Date(lastMarking.timestamp);
      const isDifferentDay =
        lastMarkingDate.getDate() !== now.getDate() ||
        lastMarkingDate.getMonth() !== now.getMonth() ||
        lastMarkingDate.getFullYear() !== now.getFullYear();

      setIsNewDay(isDifferentDay);
    };

    checkNewDay();
  }, [todayMarkings]);

  const loadMarkings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/employee/today-markings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTodayMarkings(data.markings || []);
    } catch (err) {
      console.error('Erro ao carregar marcações:', err);
    }
  };
  async function getAddressFromCoords(lat, lng) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "User-Agent": "MarcacoesApp/1.0 (contact@example.com)"
        }
      }
    );

    const data = await res.json();
    return data.display_name || null;
  }


  const handleMarking = async (type) => {
    const token = localStorage.getItem("token");

    if (!navigator.geolocation) {
      showNotification("O seu navegador não suporta geolocalização.", "error");
      return;
    }

    let latitude, longitude;

    // 🔹 1. ISOLAMOS O GEOLOCATION
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
          }
        );
      });

      latitude = position.coords.latitude;
      longitude = position.coords.longitude;

      console.log("✔ GEO OK:", latitude, longitude);
    } catch (geoErr) {
      console.error("❌ ERRO GEO:", geoErr);

      if (geoErr.code === 1) {
        showNotification("Permissão negada! Ativa a localização.", "error");
      } else if (geoErr.code === 2) {
        showNotification("Localização indisponível! Liga o WiFi/GPS.", "error");
      } else if (geoErr.code === 3) {
        showNotification("Timeout ao obter localização.", "error");
      } else {
        showNotification("Erro desconhecido ao obter geolocalização.", "error");
      }

      return; // PARA AQUI porque falhou a GEOLOCALIZAÇÃO
    }

    // 🔹 2. SE CHEGAR AQUI, GEOLOCALIZAÇÃO FUNCIONA
    let address = null;

    try {
      // MUITO IMPORTANTE: User-Agent para evitar bloqueio Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        {
          headers: {
            "User-Agent": "TimeControlApp/1.0 (admin@empresa.com)",
            "Accept-Language": "pt-PT"
          }
        }
      );

      const data = await res.json();
      address = data.display_name || null;
    } catch (err) {
      console.error("❌ ERRO NO REVERSE GEOCODING:", err);
      address = null; // fallback
    }

    // 🔹 3. Enviar a marcação ao backend
    try {
      const res = await fetch("/api/employee/mark-time", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          latitude,
          longitude,
          address,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification(data.message, "success");
        loadMarkings();
      } else {
        showNotification(data.message || "Erro ao marcar hora", "error");
      }
    } catch (err) {
      console.error("❌ ERRO AO ENVIAR PARA O BACKEND:", err);
      showNotification("Erro interno ao comunicar com o servidor.", "error");
    }
  };


  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      z-index: 1000;
      transform: translateX(400px);
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      background: ${type === 'success'
        ? 'linear-gradient(135deg, #10b981, #059669)'
        : 'linear-gradient(135deg, #ef4444, #dc2626)'};
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      border-left: 4px solid ${type === 'success' ? '#047857' : '#b91c1c'};
      max-width: calc(100vw - 40px);
      word-wrap: break-word;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => (notification.style.transform = 'translateX(0)'), 100);
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 400);
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>A carregar o seu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.dashboard}>
        {/* Header Mobile First */}
        <header style={styles.header}>
          <div style={styles.userSection}>
            <div style={styles.avatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={styles.userInfo}>
              <h1 style={styles.welcomeText}>Bem-vindo, {user?.name}</h1>
              <p style={styles.roleText}>
                {user?.role === 'employee' ? 'Funcionário' : user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={styles.logoutBtn}
            onMouseOver={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #2B416A, #1e2d4d)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #F3C80B, #e6b905)';
            }}
          >
            Terminar Sessão
          </button>
        </header>

        {/* Main Content - Mobile First */}
        <main style={styles.main}>
          {/* Time Section */}
          <div style={styles.timeSection}>
            <div style={styles.timeCard}>
              <div style={styles.dateDisplay}>
                {currentTime.toLocaleDateString('pt-PT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div style={styles.clockDisplay}>
                {currentTime.toLocaleTimeString('pt-PT')}
              </div>
            </div>
          </div>

          {/* Stats and TimeTracker - Stack on mobile */}
          <div style={styles.contentGrid}>
            <div style={styles.statsSection}>
              <StatsCard />
            </div>
            <div style={styles.trackerSection}>
              <TimeTracker
                onMarking={handleMarking}
                todayMarkings={todayMarkings}
                currentTime={currentTime}
                isNewDay={isNewDay}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* 🔸 COMPONENTE: StatsCard Mobile Friendly                              */
/* ---------------------------------------------------------------------- */
function StatsCard() {
  const [stats, setStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/employee/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao carregar estatísticas');

      const resMonth = await fetch('/api/employee/monthly-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataMonth = await resMonth.json();
      if (!resMonth.ok) throw new Error(dataMonth.message || 'Erro ao carregar estatísticas mensais');

      setStats(data);
      setMonthlyStats(dataMonth);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.statsCard}>
        <div style={styles.loadingState}>
          <div style={styles.smallSpinner}></div>
          <p style={styles.loadingText}>A carregar estatísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.statsCard}>
        <div style={styles.errorState}>
          <div style={styles.errorIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p style={styles.errorText}>Erro: {error}</p>
          <button onClick={loadStats} style={styles.retryBtn}>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.statsCard}>
      <div style={styles.statsHeader}>
        <h2 style={styles.statsTitle}>Resumo de Horas</h2>
        <button
          onClick={loadStats}
          style={styles.refreshBtn}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2072ac">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div style={styles.statInfo}>
            <h4 style={styles.statLabel}>Hoje</h4>
            <p style={styles.statValue}>{stats.todayHours || '00:00'}</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2072ac">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div style={styles.statInfo}>
            <h4 style={styles.statLabel}>Semana</h4>
            <p style={styles.statValue}>{stats.weekHours || '00:00'}</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2072ac">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <path d="M12 12h.01" />
            </svg>
          </div>
          <div style={styles.statInfo}>
            <h4 style={styles.statLabel}>Mês</h4>
            <p style={styles.statValue}>
              {monthlyStats?.total_hours
                ? Number(monthlyStats.total_hours).toFixed(1) + 'h'
                : '00:00'}
            </p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2072ac">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div style={styles.statInfo}>
            <h4 style={styles.statLabel}>Extra</h4>
            <p style={{ ...styles.statValue, ...styles.overtimeValue }}>
              {monthlyStats?.overtime_hours
                ? '+' + Number(monthlyStats.overtime_hours).toFixed(1) + 'h'
                : '00:00'}
            </p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2072ac">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div style={styles.statInfo}>
            <h4 style={styles.statLabel}>Pagamento</h4>
            <p style={styles.statValue}>{stats.daysUntilPayday || 0}d</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* 🔸 COMPONENTE: TimeTracker Mobile Friendly                            */
/* ---------------------------------------------------------------------- */
function TimeTracker({ onMarking, todayMarkings, currentTime, isNewDay }) {
  const [loading, setLoading] = useState(false);
  const [nextAction, setNextAction] = useState('entrada');

  useEffect(() => {
    if (isNewDay || todayMarkings.length === 0) {
      setNextAction('entrada');
      return;
    }

    const last = todayMarkings[todayMarkings.length - 1];
    const lastType = (last.type || '').toLowerCase().trim();

    if (['entrada', 'in', 'checkin', 'inicio', 'start'].includes(lastType)) {
      setNextAction('saida');
    } else if (['saida', 'out', 'checkout', 'fim', 'end'].includes(lastType)) {
      setNextAction('dia_encerrado');
    } else {
      setNextAction('entrada');
    }

  }, [todayMarkings, isNewDay]);


  async function handleMark() {
    if (loading || nextAction === 'dia_encerrado') return;
    setLoading(true);
    try {
      await onMarking(nextAction);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  }

  const isDayEnded = nextAction === 'dia_encerrado';

  return (
    <div style={styles.trackerCard}>
      <div style={styles.trackerHeader}>
        <h2 style={styles.trackerTitle}>Controlo de Horas</h2>
        <div style={styles.status}>
          <span style={styles.statusText}>
            {isDayEnded
              ? 'Dia Encerrado'
              : todayMarkings.length === 0
                ? 'Aguardando início'
                : nextAction === 'saida'
                  ? 'Em horário de trabalho'
                  : 'Pronto para iniciar'}
          </span>
        </div>
      </div>

      {/* Se o dia acabou, mostrar cartão final */}
      {isDayEnded ? (
        <div style={styles.endOfDayCard}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2072ac">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p style={styles.endOfDayText}>Dia encerrado — bom descanso!</p>
          <p style={styles.endOfDaySubtext}>Volte amanhã para iniciar um novo dia de trabalho</p>
        </div>
      ) : (
        <>
          <div style={styles.currentTime}>
            <span style={styles.timeLabel}>Hora Atual</span>
            <span style={styles.timeDisplay}>
              {currentTime.toLocaleTimeString('pt-PT')}
            </span>
          </div>

          <button
            onClick={handleMark}
            disabled={loading}
            style={{
              ...styles.markButton,
              backgroundColor: nextAction === 'entrada' ? '#10b981' : '#ef4444',
              ...(loading ? styles.buttonLoading : {}),
            }}
          >
            {loading ? (
              <div style={styles.buttonContent}>
                <div style={styles.spinner}></div>
                Processando...
              </div>
            ) : (
              <div style={styles.buttonContent}>
                {nextAction === 'entrada' ? 'Iniciar Trabalho' : 'Finalizar o Dia'}
              </div>
            )}
          </button>
        </>
      )}

      {/* Lista de marcações */}
      <div style={styles.markingsSection}>
        <h4 style={styles.markingsTitle}>Marcações de Hoje</h4>
        {todayMarkings.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Nenhuma marcação hoje</p>
          </div>
        ) : (
          <div style={styles.markingsList}>
            {todayMarkings.map((marking, index) => (
              <div key={index} style={styles.markingItem}>
                <div style={styles.markingTime}>
                  {new Date(marking.timestamp).toLocaleTimeString('pt-PT')}
                </div>
                <div
                  style={{
                    ...styles.markingType,
                    ...(marking.type === 'entrada'
                      ? styles.entradaType
                      : styles.saidaType),
                  }}
                >
                  {marking.type === 'entrada' ? 'Entrada' : 'Saída'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ESTILOS MOBILE FIRST
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #2072ac 0%, #1a5a8a 100%)',
    padding: '12px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  dashboard: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #2072ac 0%, #1a5a8a 100%)',
    padding: '20px',
  },
  loadingContent: {
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '30px 20px',
    borderRadius: '16px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '300px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #F3C80B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  smallSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f4f6',
    borderTop: '2px solid #F3C80B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 12px',
  },
  loadingText: {
    color: '#2072ac',
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
  },
  // Header Mobile
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '20px',
    borderRadius: '16px',
    marginBottom: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2072ac, #2B416A)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2072ac',
    margin: '0 0 4px 0',
    lineHeight: '1.2',
  },
  roleText: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500',
  },
  logoutBtn: {
    background: 'linear-gradient(135deg, #F3C80B, #e6b905)',
    color: '#2072ac',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    width: '100%',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  // Time Section
  timeSection: {
    display: 'flex',
    justifyContent: 'center',
  },
  timeCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '20px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '2px solid rgba(243, 200, 11, 0.2)',
    width: '100%',
    maxWidth: '400px',
  },
  dateDisplay: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '8px',
    fontWeight: '500',
  },
  clockDisplay: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2072ac',
    fontFamily: "'Courier New', monospace",
  },
  // Content Grid - Stack on mobile
  contentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statsSection: {
    width: '100%',
  },
  trackerSection: {
    width: '100%',
  },
  // Stats Card Mobile
  statsCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  statsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  statsTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2072ac',
    margin: 0,
  },
  refreshBtn: {
    backgroundColor: '#F3C80B',
    color: '#2072ac',
    border: 'none',
    padding: '6px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(248, 250, 252, 0.8)',
    borderRadius: '10px',
    border: '1px solid rgba(226, 232, 240, 0.6)',
  },
  statIcon: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(32, 114, 172, 0.1)',
    borderRadius: '8px',
    padding: '6px',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    margin: '0 0 2px 0',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#2072ac',
    margin: 0,
    fontFamily: "'Courier New', monospace",
  },
  overtimeValue: {
    color: '#e67e22',
  },
  // Time Tracker Mobile
  trackerCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  trackerHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  trackerTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2072ac',
    margin: 0,
  },
  status: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    padding: '6px 12px',
    borderRadius: '16px',
    border: '1px solid rgba(226, 232, 240, 0.6)',
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#2072ac',
  },
  currentTime: {
    textAlign: 'center',
    padding: '16px',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    borderRadius: '10px',
    border: '2px solid #2072ac',
    marginBottom: '16px',
  },
  timeLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '4px',
  },
  timeDisplay: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2072ac',
    fontFamily: "'Courier New', monospace",
  },
  markButton: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  buttonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  buttonIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  markingsSection: {
    borderTop: '2px solid rgba(241, 245, 249, 0.8)',
    paddingTop: '16px',
  },
  markingsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2072ac',
    marginBottom: '12px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    gap: '8px',
  },
  emptyIcon: {
    opacity: 0.5,
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  markingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  markingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: 'rgba(248, 250, 252, 0.8)',
    borderRadius: '8px',
    borderLeft: '3px solid #2072ac',
  },
  markingTime: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#2072ac',
    fontFamily: "'Courier New', monospace",
  },
  markingType: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  markingIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  entradaType: {
    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
    color: '#166534',
  },
  saidaType: {
    background: 'linear-gradient(135deg, #fecaca, #fca5a5)',
    color: '#991b1b',
  },

  endOfDayCard: {
    textAlign: 'center',
    padding: '30px 20px',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    borderRadius: '16px',
    border: '2px solid #2072ac',
    margin: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  endOfDayText: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2072ac',
    margin: 0,
  },
  endOfDaySubtext: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500',
  },
  // Error States
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    gap: '8px',
    textAlign: 'center',
  },
  errorIcon: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '50%',
    color: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '12px',
    fontWeight: '500',
    margin: 0,
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '11px',
  },
};

// MEDIA QUERIES PARA TABLET E DESKTOP
const mediaQueries = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Tablet */
  @media (min-width: 768px) {
    .container {
      padding: 20px;
    }
    
    .header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
    }
    
    .logout-btn {
      width: auto;
    }
    
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .welcome-text {
      font-size: 24px;
    }
    
    .avatar {
      width: 56px;
      height: 56px;
      font-size: 20px;
    }
    
    .time-card {
      padding: 24px 32px;
    }
    
    .clock-display {
      font-size: 28px;
    }
    
    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    
    .tracker-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(5, 1fr);
    }
    
    .stat-card {
      flex-direction: column;
      text-align: center;
      gap: 8px;
    }
    
    .stat-info {
      text-align: center;
    }
    
    .markings-list {
      max-height: 200px;
    }
  }

  /* Large Desktop */
  @media (min-width: 1200px) {
    .container {
      padding: 24px;
    }
  }

  /* Mobile Landscape */
  @media (max-height: 500px) and (orientation: landscape) {
    .container {
      padding: 8px;
    }
    
    .header {
      padding: 12px 16px;
    }
    
    .main {
      gap: 12px;
    }
    
    .time-card, .stats-card, .tracker-card {
      padding: 16px;
    }
  }
    
`;

// Adicionar media queries
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = mediaQueries;
  document.head.appendChild(styleSheet);
}

export default withAuth(DashboardFuncionario, ['employee', 'funcionario']);
