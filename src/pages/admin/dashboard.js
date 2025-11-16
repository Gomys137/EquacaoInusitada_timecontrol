// src/pages/admin/dashboard.js
import { useEffect, useState } from 'react';
import withAuth from '../../utils/withAuth';

function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [markings, setMarkings] = useState([]);
  const [filteredMarkings, setFilteredMarkings] = useState([]);
  const [showMarkings, setShowMarkings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('7');
  const [employeeFilter, setEmployeeFilter] = useState('');

  async function loadEmployees() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao carregar funcionários');
      setEmployees(data.employees);
      setFiltered(data.employees);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMarkings() {
    try {
      setLoadingMarks(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/marcacoes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao carregar marcações');

      const allMarks = [];
      for (const date in data.markings) {
        data.markings[date].forEach(m =>
          allMarks.push({
            ...m,
            date,
            timestamp: new Date(m.timestamp),
            time: new Date(m.timestamp).toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })
        );
      }

      const sortedMarks = allMarks.sort((a, b) => b.timestamp - a.timestamp);
      setMarkings(sortedMarks);
      applyMarkingsFilters(sortedMarks, dateFilter, employeeFilter);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoadingMarks(false);
    }
  }

  const applyMarkingsFilters = (marks, daysFilter, employeeNameFilter) => {
    let filtered = [...marks];

    if (daysFilter !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(daysFilter));
      filtered = filtered.filter(mark => mark.timestamp >= daysAgo);
    }

    if (employeeNameFilter) {
      filtered = filtered.filter(mark =>
        mark.employee_name.toLowerCase().includes(employeeNameFilter.toLowerCase())
      );
    }

    setFilteredMarkings(filtered.slice(0, 100));
  };

  useEffect(() => {
    if (showMarkings && markings.length > 0) {
      applyMarkingsFilters(markings, dateFilter, employeeFilter);
    }
  }, [dateFilter, employeeFilter, showMarkings]);

  async function updateRate(id, newRate) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/update-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employee_id: id, hour_rate: parseFloat(newRate) }),
      });
      if (res.ok) loadEmployees();
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    setQuery(q);
    if (!q.trim()) setFiltered(employees);
    else
      setFiltered(
        employees.filter(emp =>
          emp.employee_name.toLowerCase().includes(q)
        )
      );
  }

  const handleShowMarkings = () => {
    if (!showMarkings) {
      loadMarkings();
    }
    setShowMarkings(!showMarkings);
  };

  const totalPaySum = filtered.reduce(
    (acc, e) => acc + parseFloat(e.total_pay || 0),
    0
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>A carregar dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p style={styles.errorText}>{error}</p>
        <button onClick={loadEmployees} style={styles.retryBtn}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.dashboard}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>Painel Administrativo</h1>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              style={styles.logoutBtn}
            >
              Terminar Sessão
            </button>
          </div>
        </header>

        {/* Barra de Pesquisa Melhorada */}
        <div style={styles.searchSection}>
          <div style={styles.searchCard}>
            <div style={styles.searchHeader}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2072ac" style={styles.searchTitleIcon}>
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 style={styles.searchTitle}>Procurar Funcionários</h3>
            </div>
            <div style={styles.searchInputContainer}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" style={styles.searchIcon}>
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Digite o nome do funcionário..."
                value={query}
                onChange={handleSearch}
                style={styles.searchInput}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={styles.clearButton}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div style={styles.searchResults}>
              <span style={styles.resultsText}>
                {filtered.length} de {employees.length} funcionários
              </span>
            </div>
          </div>
        </div>

        {/* Employees Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitleSection}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2072ac" style={styles.cardIcon}>
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <h2 style={styles.cardTitle}>Funcionários</h2>
            </div>
            <div style={styles.summary}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Total a pagar:</span>
                <span style={styles.summaryValue}>€{totalPaySum.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Tabela Responsiva */}
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Funcionário</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Localização</th>   {/* ADICIONADO */}
                </tr>
              </thead>

              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.employee_id} style={styles.tr}>
                    <td style={styles.nameCell}>
                      <div style={styles.employeeInfo}>
                        <div style={styles.avatar}>
                          {emp.employee_name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.employeeDetails}>
                          <span style={styles.name}>{emp.employee_name}</span>
                          <span style={styles.employeeId}>ID: {emp.employee_id}</span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.hoursValue}>{Number(emp.total_hours || 0).toFixed(1)}h</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.overtimeValue,
                        ...(emp.overtime_hours > 0 ? styles.hasOvertime : {})
                      }}>
                        {Number(emp.overtime_hours || 0).toFixed(1)}h
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.rateInputContainer}>
                        <span style={styles.currencySymbol}>€</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={emp.hour_rate}
                          onBlur={e => updateRate(emp.employee_id, e.target.value)}
                          style={styles.rateInput}
                        />
                      </div>
                    </td>
                    <td style={styles.totalCell}>
                      <span style={styles.totalValue}>€{Number(emp.total_pay || 0).toFixed(2)}</span>
                    </td>
                    <td style={styles.td}>
                      <details style={styles.locationDropdown}>
                        <summary style={styles.locationSummary}>
                          Ver localização
                        </summary>

                        {m.location ? (
                          <div style={styles.locationBox}>
                            <div style={styles.locationText}>
                              {m.location}
                            </div>

                            <a
                              href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.mapButton}
                            >
                              Abrir no Google Maps
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: '#6b7280', fontSize: '12px' }}>
                            Sem localização
                          </span>
                        )}
                      </details>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div style={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <p style={styles.emptyText}>Nenhum funcionário encontrado</p>
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={styles.clearSearchButton}
                >
                  Limpar pesquisa
                </button>
              )}
            </div>
          )}
        </div>

        {/* Markings Card */}
        <div style={styles.card}>
          <div style={styles.markingsHeader}>
            <div style={styles.cardTitleSection}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2072ac" style={styles.cardIcon}>
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 style={styles.cardTitle}>Marcações</h2>
            </div>
            <button
              onClick={handleShowMarkings}
              style={styles.toggleBtn}
            >
              <span style={styles.toggleIcon}>
                {showMarkings ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </span>
              {showMarkings ? 'Ocultar Marcações' : 'Ver Marcações'}
            </button>
          </div>

          {showMarkings && (
            <div style={styles.markingsContent}>
              {/* Filtros Melhorados */}
              <div style={styles.filtersCard}>
                <div style={styles.filtersHeader}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2072ac">
                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  <h4 style={styles.filtersTitle}>Filtros</h4>
                </div>
                <div style={styles.filtersGrid}>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" style={styles.filterIcon}>
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Período
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      style={styles.filterSelect}
                    >
                      <option value="1">Últimas 24h</option>
                      <option value="7">Últimos 7 dias</option>
                      <option value="30">Últimos 30 dias</option>
                      <option value="all">Todo o período</option>
                    </select>
                  </div>

                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" style={styles.filterIcon}>
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Funcionário
                    </label>
                    <div style={styles.filterInputContainer}>
                      <input
                        type="text"
                        placeholder="Todos os funcionários"
                        value={employeeFilter}
                        onChange={(e) => setEmployeeFilter(e.target.value)}
                        style={styles.filterInput}
                      />
                      {employeeFilter && (
                        <button
                          onClick={() => setEmployeeFilter('')}
                          style={styles.filterClearButton}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de Marcações */}
              {loadingMarks ? (
                <div style={styles.loadingState}>
                  <div style={styles.smallSpinner}></div>
                  <p style={styles.loadingText}>A carregar marcações...</p>
                </div>
              ) : (
                <div style={styles.tableResponsive}>
                  <div style={styles.tableHeader}>
                    <span style={styles.tableResults}>
                      {filteredMarkings.length} marcações encontradas
                    </span>
                  </div>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Data</th>
                        <th style={styles.th}>Funcionário</th>
                        <th style={styles.th}>Tipo</th>
                        <th style={styles.th}>Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMarkings.map((m, i) => (
                        <tr key={i} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={styles.dateCell}>
                              <span style={styles.date}>{m.timestamp.toLocaleDateString('pt-PT')}</span>
                              <span style={styles.weekday}>
                                {m.timestamp.toLocaleDateString('pt-PT', { weekday: 'short' })}
                              </span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.employeeName}>{m.employee_name}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.markingType,
                              ...(m.type === 'entrada' ? styles.entradaType : styles.saidaType)
                            }}>
                              {m.type === 'entrada' ? 'Entrada' : 'Saída'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.timeValue}>{m.time}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredMarkings.length === 0 && (
                    <div style={styles.emptyState}>
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p style={styles.emptyText}>Nenhuma marcação encontrada</p>
                      {(dateFilter !== 'all' || employeeFilter) && (
                        <button
                          onClick={() => {
                            setDateFilter('all');
                            setEmployeeFilter('');
                          }}
                          style={styles.clearFiltersButton}
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>
                  )}

                  {filteredMarkings.length >= 100 && (
                    <div style={styles.limitWarning}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>Mostrando os 100 registros mais recentes</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ESTILOS ATUALIZADOS
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #2072ac 0%, #1a5a8a 100%)',
    padding: '16px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  dashboard: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  // ... (manter loadingContainer, spinner, etc. do código anterior)

  // Header
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2072ac',
    margin: 0,
  },
  logoutBtn: {
    background: 'linear-gradient(135deg, #F3C80B, #e6b905)',
    color: '#2072ac',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    width: '100%',
    maxWidth: '200px',
  },

  // Barra de Pesquisa Melhorada
  searchSection: {
    marginBottom: '16px',
  },
  searchCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  searchHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  searchTitleIcon: {
    flexShrink: 0,
  },
  searchTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2072ac',
    margin: 0,
  },
  searchInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    zIndex: 2,
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    fontSize: '16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    background: '#ffffff',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  clearButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResults: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },

  // Cards Gerais
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '16px',
  },
  cardTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardIcon: {
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2072ac',
    margin: 0,
  },
  summary: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '16px',
    color: '#2072ac',
    fontWeight: '700',
  },

  // Tabelas
  tableResponsive: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    minWidth: '600px',
  },
  th: {
    padding: '16px 12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2072ac',
    borderBottom: '2px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '16px 12px',
    color: '#475569',
    whiteSpace: 'nowrap',
  },

  // Células Específicas
  nameCell: {
    padding: '16px 12px',
  },
  employeeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '150px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2072ac, #2B416A)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  employeeDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  name: {
    fontWeight: '600',
    color: '#2072ac',
    fontSize: '14px',
  },
  employeeId: {
    fontSize: '12px',
    color: '#64748b',
  },
  hoursValue: {
    fontWeight: '600',
    color: '#475569',
  },
  overtimeValue: {
    fontWeight: '500',
    color: '#64748b',
  },
  hasOvertime: {
    color: '#dc2626',
    fontWeight: '600',
  },
  rateInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  currencySymbol: {
    color: '#64748b',
    fontWeight: '500',
  },
  rateInput: {
    width: '80px',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    textAlign: 'center',
    outline: 'none',
    fontSize: '14px',
  },
  totalCell: {
    padding: '16px 12px',
  },
  totalValue: {
    fontWeight: '700',
    color: '#2072ac',
    fontSize: '14px',
  },

  locationDropdown: {
  cursor: 'pointer',
},

locationSummary: {
  color: '#2072ac',
  fontWeight: '600',
  fontSize: '13px',
  cursor: 'pointer',
  listStyle: 'none',
},

locationBox: {
  marginTop: '8px',
  padding: '10px',
  borderRadius: '8px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
},

locationText: {
  fontSize: '13px',
  color: '#475569',
  lineHeight: '1.3',
},

mapButton: {
  fontSize: '12px',
  fontWeight: '600',
  color: '#2072ac',
  textDecoration: 'underline',
  cursor: 'pointer'
},

  // Marcações
  markingsHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '16px',
  },
  toggleBtn: {
    background: 'linear-gradient(135deg, #F3C80B, #e6b905)',
    color: '#2072ac',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    maxWidth: '200px',
    justifyContent: 'center',
  },
  toggleIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  markingsContent: {
    borderTop: '2px solid #f1f5f9',
    paddingTop: '20px',
  },

  // Filtros Melhorados
  filtersCard: {
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #e2e8f0',
  },
  filtersHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  filtersTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2072ac',
    margin: 0,
  },
  filtersGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  filterIcon: {
    flexShrink: 0,
  },
  filterSelect: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    outline: 'none',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
  },
  filterInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  filterInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    outline: 'none',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
  },
  filterClearButton: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Células de Marcações
  dateCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  date: {
    fontWeight: '600',
    color: '#475569',
    fontSize: '14px',
  },
  weekday: {
    fontSize: '12px',
    color: '#64748b',
  },
  employeeName: {
    fontWeight: '500',
    color: '#475569',
  },
  markingType: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center',
    display: 'inline-block',
  },
  entradaType: {
    color: '#166534',
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
  },
  saidaType: {
    color: '#991b1b',
    backgroundColor: '#fecaca',
    border: '1px solid #fca5a5',
  },
  timeValue: {
    fontWeight: '600',
    color: '#475569',
    fontFamily: "'Courier New', monospace",
  },

  // Estados
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '12px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '16px',
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '16px',
    fontWeight: '500',
  },
  clearSearchButton: {
    background: 'linear-gradient(135deg, #F3C80B, #e6b905)',
    color: '#2072ac',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  clearFiltersButton: {
    background: 'linear-gradient(135deg, #F3C80B, #e6b905)',
    color: '#2072ac',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  tableResults: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  limitWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '8px',
    marginTop: '16px',
    fontSize: '14px',
    justifyContent: 'center',
  },
};

// MEDIA QUERIES PARA RESPONSIVIDADE
const mediaQueries = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Tablet */
  @media (min-width: 768px) {
    .header-content {
      flex-direction: row;
      justify-content: space-between;
      text-align: left;
    }
    
    .card-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    
    .markings-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    
    .filters-grid {
      flex-direction: row;
      gap: 20px;
    }
    
    .filter-group {
      flex: 1;
    }
    
    .logout-btn, .toggle-btn {
      width: auto;
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .table {
      min-width: auto;
    }
  }

  /* Mobile Pequeno */
  @media (max-width: 360px) {
    .container {
      padding: 12px;
    }
    
    .card {
      padding: 16px;
    }
    
    .search-card {
      padding: 16px;
    }
    
    .filters-card {
      padding: 16px;
    }
    
    .table {
      font-size: 12px;
    }
    
    .th, .td {
      padding: 12px 8px;
    }
    
    .rate-input {
      width: 70px;
      font-size: 12px;
    }
  }
`;

// Adicionar media queries
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = mediaQueries;
  document.head.appendChild(styleSheet);
}

export default withAuth(AdminDashboard, ['admin']);
