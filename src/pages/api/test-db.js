// src/pages/api/test-db.js
import { connectToDatabase } from '@/lib/db';

export default async function handler(req, res) {
  try {
    // DEBUG: checar se as env vars existem (não imprime valores)
    const missing = ['DB_HOST','DB_PORT','DB_USER','DB_PASS','DB_NAME'].filter(k => !process.env[k]);
    if (missing.length) {
      console.error('MISSING_ENV_VARS', missing);
      return res.status(500).json({ ok:false, error: 'Missing env vars', missing });
    }

    // tentar ligar e capturar erros detalhados
    const pool = await connectToDatabase();
    const [rows] = await pool.query('SELECT NOW() AS now');
    return res.status(200).json({ ok: true, now: rows[0].now });
  } catch (err) {
    // imprime stack no log da Vercel (visível no Dashboard → Deployments → Logs)
    console.error('TEST-DB-ERROR', err && err.stack ? err.stack : String(err));
    return res.status(500).json({ ok:false, error: err.message || String(err) });
  }
}
