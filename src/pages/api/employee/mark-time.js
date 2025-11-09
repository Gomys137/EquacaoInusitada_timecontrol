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
    const { type } = req.body;

    if (!['entrada', 'saida'].includes(type)) {
      return res.status(400).json({ message: 'Tipo inválido' });
    }

    const db = await connectToDatabase();

    // 🔹 BLOQUEIO: só pode marcar uma "entrada" e uma "saída" por dia
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

    // 🔹 Grava a marcação
    await db.execute(
      'INSERT INTO markings (employee_id, type, timestamp) VALUES (?, ?, NOW())',
      [employeeId, type]
    );
    console.log(`✅ Marcação ${type} registada para employee_id=${employeeId}`);

    // =====================
    // 🔹 CÁLCULO HORAS MENSAIS
    // =====================
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
      console.log('🔁 Atualizado registro mensal existente');
    } else {
      await db.execute(
        `INSERT INTO employee_monthly_stats 
         (employee_id, month_start, month_end, total_hours, overtime_hours)
         VALUES (?, ?, ?, ?, ?)`,
        [employeeId, monthStart, monthEnd, totalHours, overtime]
      );
      console.log('✅ Criado novo registro mensal');
    }

    res.status(201).json({
      message: `Marcação de ${type} registada com sucesso!`,
      month: { total: totalHours, overtime }
    });
  } catch (error) {
    console.error('❌ Erro ao marcar:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
