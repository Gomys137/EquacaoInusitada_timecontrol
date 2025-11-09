// src/pages/api/admin/update-rate.js
import { connectToDatabase } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { employee_id, hour_rate } = req.body;

    const db = await connectToDatabase();

    // Atualiza o valor/hora do funcionário
    await db.execute('UPDATE employees SET hour_rate = ? WHERE id = ?', [hour_rate, employee_id]);

    res.status(200).json({ message: 'Valor por hora atualizado!' });
  } catch (error) {
    console.error('❌ Erro ao atualizar valor/hora:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
