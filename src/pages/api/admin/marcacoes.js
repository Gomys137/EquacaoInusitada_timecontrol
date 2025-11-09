// src/pages/api/admin/marcacoes.js
import { connectToDatabase } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const db = await connectToDatabase();

    // Junta funcionários + marcações
    const [rows] = await db.execute(`
      SELECT 
        m.id AS marking_id,
        e.name AS employee_name,
        m.employee_id,
        m.type,
        m.timestamp
      FROM markings m
      JOIN employees e ON e.id = m.employee_id
      ORDER BY m.timestamp DESC
      LIMIT 1000
    `);

    // Agrupa por dia
    const grouped = {};
    rows.forEach(r => {
      const date = new Date(r.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(r);
    });

    res.status(200).json({ markings: grouped });
  } catch (error) {
    console.error('❌ Erro ao carregar marcações:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
