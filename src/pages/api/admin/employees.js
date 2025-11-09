// src/pages/api/admin/employees.js
import { connectToDatabase } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const db = await connectToDatabase();

    // Junta funcionários + horas mensais
    const [rows] = await db.execute(`
      SELECT 
        e.id AS employee_id,
        e.name AS employee_name,
        COALESCE(s.total_hours, 0) AS total_hours,
        COALESCE(s.overtime_hours, 0) AS overtime_hours,
        COALESCE(e.hour_rate, 0) AS hour_rate
      FROM employees e
      LEFT JOIN employee_monthly_stats s 
        ON e.id = s.employee_id 
        AND s.month_start = DATE_FORMAT(CURDATE(), '%Y-%m-01')
      ORDER BY e.name ASC
    `);

    // Calcular pagamento
    const data = rows.map(r => ({
      ...r,
      total_pay: (r.total_hours * r.hour_rate).toFixed(2),
    }));

    res.status(200).json({ employees: data });
  } catch (error) {
    console.error('❌ Erro ao carregar funcionários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
