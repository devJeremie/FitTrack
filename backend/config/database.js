const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'fittrack',
  user: process.env.DB_USER || 'fittrack_user',
  password: process.env.DB_PASSWORD || 'fittrack_pass',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

pool.getConnection()
  .then(conn => {
    console.log('MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL connection failed:', err.message);
  });

module.exports = pool;
