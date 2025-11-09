// src/pages/api/test-db.js
import { connectToDatabase } from '@/lib/db';

export default async function handler(req, res) {
  try {
    const pool = await connectToDatabase();
    const [rows] = await pool.query('SELECT NOW() AS now');
    return res.status(200).json({ ok: true, now: rows[0].now });
  } catch (err) {
    console.error('API /test-db error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Erro ao ligar à BD' });
  }
}
