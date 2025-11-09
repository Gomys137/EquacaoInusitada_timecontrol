import { connectToDatabase } from '../../../lib/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ message: 'Método não permitido' });

  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ message: 'Nome de utilizador e password são obrigatórios' });

  try {
    const db = await connectToDatabase();

    const [rows] = await db.execute(
      'SELECT * FROM employees WHERE username = ? AND active = 1',
      [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ message: 'Utilizador não encontrado' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Password incorreta' });

    // 🔒 garante que role nunca é nulo
    const role = user.role && user.role.trim() !== '' ? user.role : 'funcionario';

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    return res.status(200).json({
      message: 'Login com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: role, // ✅ devolve sempre role válido
      },
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
