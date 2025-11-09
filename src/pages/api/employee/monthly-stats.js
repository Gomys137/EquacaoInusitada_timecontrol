import { connectToDatabase } from '../../../lib/db.js';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Token necessário' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id: employeeId } = decoded;

    const pool = await connectToDatabase();
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');

    const [rows] = await pool.execute(
      'SELECT total_hours FROM employee_monthly_stats WHERE employee_id = ? AND month_start = ?',
      [employeeId, monthStart]
    );

    if (rows.length === 0) {
      return res.status(200).json({ total_hours: 0 });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Erro ao carregar horas do mês:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
