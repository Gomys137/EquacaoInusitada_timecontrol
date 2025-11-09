// src/lib/db.js
import mysql from 'mysql2/promise';

let pool;

export async function connectToDatabase() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5, // evita ultrapassar limite do FreeSQLDatabase
      queueLimit: 0,
    });
  }

  return pool;
}
