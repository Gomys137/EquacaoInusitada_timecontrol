import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/db.js';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
dayjs.extend(isoWeek);

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Token necessário' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id: employeeId } = decoded;

    const { type, latitude, longitude, address } = req.body;

    if (!['entrada', 'saida'].includes(type)) {
      return res.status(400).json({ message: 'Tipo inválido' });
    }

    // 🔹 Validação mínima da localização
    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'A localização é obrigatória para marcar a hora.',
      });
    }

    const db = await connectToDatabase();

    // 🔹 BLOQUEIO: apenas uma entrada e uma saída por dia
    const todayStart = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const todayEnd = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const [todayRows] = await db.execute(
      `SELECT type FROM markings 
       WHERE employee_id = ? 
       AND timestamp BETWEEN ? AND ?`,
      [employeeId, todayStart, todayEnd]
    );

    const alreadyHasEntrada = todayRows.some(r => r.type === 'entrada');
    const alreadyHasSaida = todayRows.some(r => r.type === 'saida');

    if (type === 'entrada' && alreadyHasEntrada) {
      return res.status(400).json({ message: 'Já marcaste entrada hoje!' });
    }
    if (type === 'saida' && !alreadyHasEntrada) {
      return res.status(400).json({ message: 'Ainda não marcaste entrada hoje!' });
    }
    if (type === 'saida' && alreadyHasSaida) {
      return res.status(400).json({ message: 'Já marcaste saída hoje!' });
    }

    // ======================================================
    // 🔹 INSERIR MARCAÇÃO COM LOCALIZAÇÃO
    // ======================================================
    await db.execute(
      `INSERT INTO markings (employee_id, type, timestamp, latitude, longitude, location)
       VALUES (?, ?, NOW(), ?, ?, ?)`,
      [employeeId, type, latitude, longitude, address || null]
    );

    console.log(`📍 Localização guardada para employee_id=${employeeId}: 
      lat=${latitude}, lng=${longitude}, address=${address}`);

    // ======================================================
    // 🔹 CÁLCULO DE HORAS MENSAIS (mantido do teu código)
    // ======================================================

    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

    const [rows] = await db.execute(
      `SELECT type, timestamp 
       FROM markings 
       WHERE employee_id = ? 
       AND DATE(timestamp) BETWEEN DATE(?) AND DATE(?) 
       ORDER BY timestamp ASC`,
      [employeeId, monthStart, monthEnd]
    );

    let totalMs = 0;
    let entrada = null;

    for (const r of rows) {
      if (r.type === 'entrada') entrada = new Date(r.timestamp);
      else if (r.type === 'saida' && entrada) {
        totalMs += new Date(r.timestamp) - entrada;
        entrada = null;
      }
    }

    const totalHours = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));
    const overtime = parseFloat(Math.max(0, totalHours - 160).toFixed(2));

    const [exists] = await db.execute(
      `SELECT id FROM employee_monthly_stats 
       WHERE employee_id = ? AND month_start = ?`,
      [employeeId, monthStart]
    );

    if (exists.length > 0) {
      await db.execute(
        `UPDATE employee_monthly_stats 
         SET total_hours = ?, overtime_hours = ?, last_updated = NOW() 
         WHERE employee_id = ? AND month_start = ?`,
        [totalHours, overtime, employeeId, monthStart]
      );
    } else {
      await db.execute(
        `INSERT INTO employee_monthly_stats 
         (employee_id, month_start, month_end, total_hours, overtime_hours)
         VALUES (?, ?, ?, ?, ?)`,
        [employeeId, monthStart, monthEnd, totalHours, overtime]
      );
    }

    return res.status(201).json({
      message: `Marcação de ${type} registada com sucesso!`,
      month: { total: totalHours, overtime },
    });
  } catch (error) {
    console.error('❌ Erro ao marcar:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
