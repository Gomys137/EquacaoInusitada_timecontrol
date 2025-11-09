// src/lib/db.js
import mysql from 'mysql2/promise';

let pool;

export async function connectToDatabase() {
  if (pool) return pool;

  try {
    // validações básicas para ajudar debug
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_NAME) {
      throw new Error('Variáveis de ambiente DB_HOST/DB_USER/DB_PASS/DB_NAME não configuradas.');
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      // aumenta timeout se necessário:
      // connectTimeout: 10000
    });

    // faz um teste de ligação rápido
    const conn = await pool.getConnection();
    conn.release();

    return pool;
  } catch (err) {
    // logging útil para debug (imprime no log do servidor/Vercel)
    console.error('ERRO connectToDatabase:', err.message || err);
    // relança para o handler API tratar e devolver 500 com mensagem
    throw err;
  }
}
