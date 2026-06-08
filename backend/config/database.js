// ============================================================
// config/database.js — Connexion à la base de données MySQL
// Ce fichier crée et exporte un "pool" de connexions réutilisables.
// ============================================================

const mysql = require('mysql2/promise');

// ---- Qu'est-ce qu'un pool de connexions ? ----
// Établir une connexion MySQL à chaque requête est coûteux (~100ms).
// Un pool maintient un ensemble de connexions ouvertes et prêtes à l'emploi.
// Quand une requête arrive, elle prend une connexion disponible, l'utilise,
// puis la relâche dans le pool (elle n'est pas fermée, juste réutilisée).
const pool = mysql.createPool({
  // Les valeurs viennent du .env (injectées par Docker en production)
  host: process.env.DB_HOST || 'mysql',       // Nom du service Docker
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'fittrack',
  user: process.env.DB_USER || 'fittrack_user',
  password: process.env.DB_PASSWORD || 'fittrack_pass',

  // utf8mb4 supporte tous les caractères Unicode (dont les emojis et accents)
  // Sans ça, les caractères spéciaux peuvent être corrompus à l'insertion
  charset: 'utf8mb4',

  // waitForConnections : si le pool est plein, mettre la requête en file d'attente
  // (plutôt que de retourner une erreur immédiatement)
  waitForConnections: true,

  // Nombre maximum de connexions simultanées dans le pool
  connectionLimit: 10,

  // 0 = file d'attente illimitée (0 signifie pas de limite)
  queueLimit: 0,

  // Stocke les dates en UTC dans MySQL pour éviter les décalages horaires
  timezone: '+00:00',
});

// ---- Test de connexion au démarrage ----
// On vérifie immédiatement que MySQL est joignable.
// getConnection() prend une connexion du pool ; conn.release() la remet à disposition.
// Si ça échoue (MySQL pas encore démarré), un message d'erreur est affiché.
pool.getConnection()
  .then(conn => {
    console.log('MySQL connected successfully');
    conn.release(); // Toujours libérer la connexion après usage !
  })
  .catch(err => {
    console.error('MySQL connection failed:', err.message);
  });

// Export du pool : tous les models l'importent pour exécuter des requêtes SQL
module.exports = pool;
