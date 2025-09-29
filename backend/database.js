// database.js
import 'dotenv/config'; // โหลด .env ก่อนทุกอย่าง  
import mysql from 'mysql2/promise';

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  // ให้ default ชื่อเดียวกับ .env ของคุณ
  DB_NAME = 'project_cards_db',
} = process.env;

let pool;

async function ensureDatabaseExists() {
  // ต่อแบบยังไม่ระบุ database ก่อน
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: false,
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
       DEFAULT CHARACTER SET utf8mb4
       COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await conn.end();
  }
}

export async function getPool() {
  if (!pool) {
    // สร้าง DB ให้เรียบร้อยก่อนค่อยทำ pool
    await ensureDatabaseExists();
    pool = await mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: 'Z',
      charset: 'utf8mb4',
      multipleStatements: false,
    });
  }
  return pool;
}

export async function ensureSchema() {
  // ตอนนี้ DB มีแน่ ๆ แล้ว สร้างตารางได้เลย
  const ddl = `
      CREATE TABLE IF NOT EXISTS profiles (
        id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
        first_name   VARCHAR(100) NOT NULL,
        last_name    VARCHAR(100) NOT NULL,
        student_id   VARCHAR(32)  NOT NULL,
        email        VARCHAR(255) NULL,
        phone_number VARCHAR(64)  NULL,
        gender       ENUM('male','female','other') NULL,
        image_url    VARCHAR(512) NULL,
        social_url   VARCHAR(512) NULL,
        dob          DATE NULL,
        weight_kg    DECIMAL(5,2) UNSIGNED NULL,
        height_cm    DECIMAL(5,2) UNSIGNED NULL,
        created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY(id),
        UNIQUE KEY uq_profiles_student_id (student_id),
        UNIQUE KEY uq_profiles_email (email),
        INDEX idx_profiles_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  const p = await getPool();
  await p.query(ddl);
}
