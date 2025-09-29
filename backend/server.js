// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, ensureSchema } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------- CORS ----------
const allowList = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowList.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ---------- Middlewares ----------
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// ---------- Static uploads ----------
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// ---------- Multer (file upload) ----------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

// ---------- Wrapper: create router then mount on "/" and "/api" ----------
function makeRouter() {
  const r = express.Router();

  // Health
  r.get('/healthz', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  // List all
  r.get('/profiles', async (_req, res) => {
    try {
      const pool = await getPool();
      const [rows] = await pool.query('SELECT * FROM profiles ORDER BY id DESC');
      res.json(rows);
    } catch (err) {
      console.error('GET /profiles error:', err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Get by id
  r.get('/profiles/:id', async (req, res) => {
    try {
      const pool = await getPool();
      const [rows] = await pool.query('SELECT * FROM profiles WHERE id=?', [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'not_found' });
      res.json(rows[0]);
    } catch (err) {
      console.error('GET /profiles/:id error:', err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Create
  r.post('/profiles', async (req, res) => {
    try {
      const {
        first_name, last_name, student_id, email, phone_number,
        gender, dob, social_url, weight_kg, height_cm, image_url,
      } = req.body || {};

      if (!first_name || !last_name) return res.status(400).json({ error: 'กรอกชื่อ-นามสกุล' });

      const pool = await getPool();

      // duplicate check (soft)
      const [dup] = await pool.query(`
        SELECT id, student_id, email, phone_number FROM profiles
        WHERE (student_id IS NOT NULL AND student_id = ?)
           OR (email IS NOT NULL AND email = ?)
           OR (phone_number IS NOT NULL AND phone_number = ?)
        LIMIT 1
      `, [student_id || null, email || null, phone_number || null]);

      if (dup.length) {
        const d = dup[0];
        if (student_id && d.student_id === student_id) return res.status(409).json({ error: 'student_id_duplicated', field: 'student_id' });
        if (email && d.email === email) return res.status(409).json({ error: 'email_duplicated', field: 'email' });
        if (phone_number && d.phone_number === phone_number) return res.status(409).json({ error: 'phone_duplicated', field: 'phone_number' });
        return res.status(409).json({ error: 'duplicate' });
      }

      const [result] = await pool.query(
        `INSERT INTO profiles
         (first_name,last_name,student_id,email,phone_number,gender,dob,social_url,weight_kg,height_cm,image_url)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          first_name, last_name, student_id || null, email || null, phone_number || null,
          gender || null, dob || null, social_url || null,
          weight_kg ?? null, height_cm ?? null, image_url || null,
        ],
      );

      const [row] = await pool.query('SELECT * FROM profiles WHERE id=?', [result.insertId]);
      res.status(201).json(row[0]);
    } catch (err) {
      console.error('POST /profiles error:', err);
      if (err?.code === 'ER_DUP_ENTRY') {
        const msg = String(err.message || '');
        if (msg.includes('student_id')) return res.status(409).json({ error: 'student_id_duplicated', field: 'student_id' });
        if (msg.includes('email')) return res.status(409).json({ error: 'email_duplicated', field: 'email' });
        if (msg.includes('phone_number')) return res.status(409).json({ error: 'phone_duplicated', field: 'phone_number' });
        return res.status(409).json({ error: 'duplicate' });
      }
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Update
  r.put('/profiles/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const {
        first_name, last_name, student_id, email, phone_number,
        gender, dob, social_url, weight_kg, height_cm, image_url,
      } = req.body || {};

      if (!first_name || !last_name) return res.status(400).json({ error: 'กรอกชื่อ-นามสกุล' });

      const pool = await getPool();

      // duplicate check with others
      const [dup] = await pool.query(`
        SELECT id, student_id, email, phone_number FROM profiles
        WHERE id <> ? AND (
               (student_id IS NOT NULL AND student_id = ?)
            OR (email IS NOT NULL AND email = ?)
            OR (phone_number IS NOT NULL AND phone_number = ?)
        ) LIMIT 1
      `, [id, student_id || null, email || null, phone_number || null]);

      if (dup.length) {
        const d = dup[0];
        if (student_id && d.student_id === student_id) return res.status(409).json({ error: 'student_id_duplicated', field: 'student_id' });
        if (email && d.email === email) return res.status(409).json({ error: 'email_duplicated', field: 'email' });
        if (phone_number && d.phone_number === phone_number) return res.status(409).json({ error: 'phone_duplicated', field: 'phone_number' });
        return res.status(409).json({ error: 'duplicate' });
      }

      await pool.query(
        `UPDATE profiles SET
          first_name=?, last_name=?, student_id=?, email=?, phone_number=?,
          gender=?, dob=?, social_url=?, weight_kg=?, height_cm=?, image_url=?
         WHERE id=?`,
        [
          first_name, last_name, student_id || null, email || null, phone_number || null,
          gender || null, dob || null, social_url || null,
          weight_kg ?? null, height_cm ?? null, image_url || null, id,
        ],
      );

      const [row] = await pool.query('SELECT * FROM profiles WHERE id=?', [id]);
      if (!row.length) return res.status(404).json({ error: 'not_found' });
      res.json(row[0]);
    } catch (err) {
      console.error('PUT /profiles/:id error:', err);
      if (err?.code === 'ER_DUP_ENTRY') {
        const msg = String(err.message || '');
        if (msg.includes('student_id')) return res.status(409).json({ error: 'student_id_duplicated', field: 'student_id' });
        if (msg.includes('email')) return res.status(409).json({ error: 'email_duplicated', field: 'email' });
        if (msg.includes('phone_number')) return res.status(409).json({ error: 'phone_duplicated', field: 'phone_number' });
        return res.status(409).json({ error: 'duplicate' });
      }
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Delete
  r.delete('/profiles/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const pool = await getPool();
      const [info] = await pool.query('DELETE FROM profiles WHERE id=?', [id]);
      if (info.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
      res.json({ ok: true });
    } catch (err) {
      console.error('DELETE /profiles/:id error:', err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Upload avatar
  r.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'no_file' });
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, thumb_url: fileUrl }); // ถ้าจะทำ thumb ค่อยใส่ sharp ภายหลัง
    } catch (err) {
      console.error('POST /upload-avatar error:', err);
      res.status(500).json({ error: 'upload_failed' });
    }
  });

  return r;
}

const router = makeRouter();
app.use('/', router);      // รองรับ /profiles
app.use('/api', router);   // และ /api/profiles

// ---------- Start ----------
const PORT = Number(process.env.PORT || 5000);

async function start() {
  try {
    await ensureSchema();
    app.listen(PORT, () => {
      console.log(`listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('[BOOT] failed:', err);
    process.exitCode = 1;
  }
}

start();
