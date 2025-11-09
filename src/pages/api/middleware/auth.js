// src/pages/api/middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_segura';

export function authMiddleware(handler) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'Token de autenticação necessário' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      return handler(req, res);
    } catch (error) {
      console.error('Erro no middleware de autenticação:', error);
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
  };
}
