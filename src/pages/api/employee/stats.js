// pages/api/employee/stats.js
import { authMiddleware } from '../middleware/auth.js';
import { connectToDatabase } from '../../../lib/db.js';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
dayjs.extend(isoWeek);

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const db = await connectToDatabase();
    const userId = req.user.id;

    // Datas base
    const todayStart = dayjs().startOf('day').toDate();
    const weekStart = dayjs().startOf('isoWeek').toDate();
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');

    // Marcações de hoje
    const [todayRows] = await db.execute(
      'SELECT type, timestamp FROM markings WHERE employee_id = ? AND timestamp >= ? ORDER BY timestamp ASC',
      [userId, todayStart]
    );

    // Marcações da semana
    const [weekRows] = await db.execute(
      'SELECT type, timestamp FROM markings WHERE employee_id = ? AND timestamp >= ? ORDER BY timestamp ASC',
      [userId, weekStart]
    );

    // Função para calcular horas (entrada/saída)
    const calcHours = (rows) => {
      let total = 0;
      let entrada = null;
      rows.forEach((r) => {
        if (r.type === 'entrada') entrada = new Date(r.timestamp);
        else if (r.type === 'saida' && entrada) {
          total += new Date(r.timestamp) - entrada;
          entrada = null;
        }
      });
      const horas = Math.floor(total / 1000 / 60 / 60);
      const minutos = Math.floor((total / 1000 / 60) % 60);
      return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    };

    const todayHours = calcHours(todayRows);
    const weekHours = calcHours(weekRows);

    // 🔹 Lê diretamente o total de horas mensais da BD
    const [monthStats] = await db.execute(
      `SELECT total_hours, overtime_hours 
       FROM employee_monthly_stats 
       WHERE employee_id = ? AND month_start = ?`,
      [userId, monthStart]
    );

    let monthHours = '00:00';
    let overtime = '00:00';

    if (monthStats.length > 0) {
      const total = monthStats[0].total_hours || 0;
      const extra = monthStats[0].overtime_hours || 0;

      const totalH = Math.floor(total);
      const totalM = Math.round((total % 1) * 60);
      const overH = Math.floor(extra);
      const overM = Math.round((extra % 1) * 60);

      monthHours = `${String(totalH).padStart(2, '0')}:${String(totalM).padStart(2, '0')}`;
      overtime = `${String(overH).padStart(2, '0')}:${String(overM).padStart(2, '0')}`;
    }

    // Próximo pagamento
    const today = new Date();
    const payday = new Date(today.getFullYear(), today.getMonth(), 30);
    if (today > payday) payday.setMonth(payday.getMonth() + 1);
    const daysUntilPayday = Math.ceil((payday - today) / (1000 * 60 * 60 * 24));

    res.status(200).json({
      todayHours,
      weekHours,
      monthHours,
      overtime,
      daysUntilPayday,
    });
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

export default authMiddleware(handler);
