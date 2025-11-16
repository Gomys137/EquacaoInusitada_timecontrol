// src/pages/admin/marcacoes.js
import { useEffect, useState } from 'react';
import withAuth from '../../utils/withAuth';



function AdminMarcacoes() {
    const [markings, setMarkings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function loadMarkings() {
        try {
            const res = await fetch('/api/admin/marcacoes');
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erro ao carregar marcações');
            setMarkings(data.markings);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMarkings();
    }, []);

    if (loading) return <p style={styles.loading}>A carregar marcações...</p>;
    if (error) return <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>;

    const dates = Object.keys(markings).sort((a, b) => new Date(b) - new Date(a));

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Marcações Diárias</h1>

            {dates.map(date => (
                <div key={date} style={styles.daySection}>
                    <h3 style={styles.dateTitle}>
                        {new Date(date).toLocaleDateString('pt-PT', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </h3>

                    <table style={styles.table}>
                        <thead>
                            <th style={styles.th}>Localização</th>
                            <th>Funcionário</th>
                            <th>Tipo</th>
                            <th>Hora</th>

                        </thead>
                        <tbody>
                            {markings[date].map(m => (
                                <tr key={m.marking_id}>
                                    {/* Localização */}
                                    <td style={styles.td}>
                                        {m.location ? (
                                            <>
                                                <div>{m.location}</div>
                                                <a
                                                    href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        color: '#2072ac',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    Ver no mapa
                                                </a>
                                            </>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                                                Sem localização
                                            </span>
                                        )}
                                    </td>

                                    {/* Funcionário */}
                                    <td style={styles.name}>
                                        {m.employee_name}
                                    </td>

                                    {/* Tipo */}
                                    <td style={m.type === 'entrada' ? styles.entrada : styles.saida}>
                                        {m.type === 'entrada' ? '🟢 Entrada' : '🔴 Saída'}
                                    </td>

                                    {/* Hora */}
                                    <td>
                                        {new Date(m.timestamp).toLocaleTimeString('pt-PT', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            ))}
        </div>
    );
}
export default withAuth(AdminMarcacoes, ['admin']);
const styles = {
    container: {
        maxWidth: '1000px',
        margin: '40px auto',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
        padding: '30px',
    },
    title: {
        textAlign: 'center',
        marginBottom: '30px',
        fontSize: '1.8rem',
    },
    daySection: {
        marginBottom: '40px',
    },
    dateTitle: {
        backgroundColor: '#f8f9fa',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '1.1rem',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px',
        fontSize: '0.95rem',
    },
    name: {
        fontWeight: '600',
    },
    entrada: {
        color: 'green',
        fontWeight: 'bold',
    },
    saida: {
        color: 'red',
        fontWeight: 'bold',
    },
    loading: {
        textAlign: 'center',
        marginTop: '40px',
    },
};
