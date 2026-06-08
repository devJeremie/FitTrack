// ============================================================
// models/user.model.js — Couche d'accès aux données (table User)
//
// Le modèle est la seule partie du code qui écrit du SQL.
// Il isole la logique de base de données du reste de l'application :
// si on change de BDD demain, seul ce fichier est à modifier.
// ============================================================

const db = require('../config/database');
const bcrypt = require('bcrypt');

// Nombre de "tours" de hachage bcrypt. Plus c'est élevé, plus c'est lent
// (et donc plus résistant aux attaques par force brute), mais aussi plus
// coûteux en CPU. 10 est la valeur recommandée par défaut.
const SALT_ROUNDS = 10;

const UserModel = {

  // ---- Créer un utilisateur ----
  async create({ username, email, password, weight, goal }) {
    // On hache le mot de passe AVANT de l'insérer en base.
    // bcrypt.hash() génère un sel aléatoire et produit un hash de 60 caractères.
    // Même si la BDD est compromise, les mots de passe restent illisibles.
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // db.execute() utilise des requêtes préparées avec des `?` (paramètres liés).
    // Chaque `?` est remplacé de façon sécurisée — protège contre l'injection SQL.
    // Ne JAMAIS concaténer des variables directement dans une requête SQL.
    const [result] = await db.execute(
      'INSERT INTO User (username, email, password, weight, goal) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, weight || null, goal || 'maintain']
    );

    // result.insertId contient l'id auto-incrémenté généré par MySQL
    return result.insertId;
  },

  // ---- Trouver par email (pour le login et la vérification de doublon) ----
  async findByEmail(email) {
    // db.execute retourne [rows, fields] — on destructure pour ne garder que rows
    const [rows] = await db.execute(
      'SELECT * FROM User WHERE email = ?',
      [email]
    );
    // rows[0] = premier résultat, ou undefined si pas trouvé → on retourne null
    return rows[0] || null;
  },

  // ---- Trouver par id (pour GET /me et après création) ----
  // On sélectionne explicitement les colonnes pour ne PAS retourner le mot de passe
  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, username, email, weight, goal, created_at FROM User WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // ---- Trouver par username (pour vérifier les doublons à l'inscription) ----
  async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT id FROM User WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  // ---- Mettre à jour le profil (mise à jour partielle) ----
  async update(id, { username, weight, goal }) {
    // Construction dynamique de la requête : on ne met à jour que les champs
    // effectivement envoyés. Si `username` est undefined, on ne le touche pas.
    const fields = [];
    const values = [];

    if (username !== undefined) { fields.push('username = ?'); values.push(username); }
    if (weight !== undefined) { fields.push('weight = ?'); values.push(weight); }
    if (goal !== undefined) { fields.push('goal = ?'); values.push(goal); }

    // Rien à mettre à jour → on retourne l'utilisateur tel quel
    if (fields.length === 0) return null;

    // L'id doit être en dernier car il correspond au `?` de la clause WHERE
    values.push(id);

    // Template literal pour construire la requête dynamiquement
    await db.execute(`UPDATE User SET ${fields.join(', ')} WHERE id = ?`, values);

    // On retourne le profil mis à jour (sans le mot de passe)
    return this.findById(id);
  },

  // ---- Vérifier le mot de passe lors du login ----
  // bcrypt.compare() re-hash le mot de passe en clair avec le sel stocké dans
  // le hash, puis compare. Retourne true si ça correspond, false sinon.
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

module.exports = UserModel;
