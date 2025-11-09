import mysql from 'mysql2/promise';

let pool;

export async function connectToDatabase() {
  if (pool) return pool;

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 28178,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
     ssl: { rejectUnauthorized: false }, // Aiven exige SSL
      waitForConnections: true,
      connectionLimit: 5,
    });

    const conn = await pool.getConnection();
    conn.release();

    console.log('✅ Ligado à base de dados MySQL da Aiven');
    return pool;
  } catch (err) {
    console.error('❌ Erro de ligação à base de dados:', err.message);
    throw err;
  }
}
