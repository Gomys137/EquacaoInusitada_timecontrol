// pages/api/employee/today-markings.js
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ message: 'Método não permitido' });

  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Token necessário' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = decoded;

    const db = await connectToDatabase();
    const [rows] = await db.execute(
      `SELECT type, timestamp FROM markings 
       WHERE employee_id = ? AND DATE(timestamp) = CURDATE()
       ORDER BY timestamp DESC`,
      [id]
    );

    return res.status(200).json({ markings: rows });
  } catch (error) {
    console.error('Erro a carregar marcações:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
}
