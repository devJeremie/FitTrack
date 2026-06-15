// ============================================================
// models/exercise.model.js — Couche d'accès aux données (table Exercise)
//
// Toutes les requêtes SQL liées aux exercices passent par ici.
// Les contrôleurs appellent ces méthodes sans jamais écrire de SQL.
// ============================================================

const db = require('../config/database');

const ExerciseModel = {

  // ---- Lister les exercices avec filtres optionnels ----
  async findAll({ category, search } = {}) {
    // On démarre avec une condition toujours vraie (WHERE 1=1)
    // pour pouvoir ajouter des AND dynamiquement sans se soucier du premier AND
    let query = 'SELECT * FROM Exercise WHERE 1=1';
    const values = [];

    // Filtrage par catégorie (si fourni dans ?category=...)
    if (category) {
      query += ' AND category = ?';
      //query + 'AND category = ?' = query
      values.push(category);
    }

    // Recherche textuelle sur le nom OU le groupe musculaire
    // LIKE avec % = contient (ex: %squat% trouve "Front Squat", "Back Squat"...)
    if (search) {
      query += ' AND (name LIKE ? OR muscle_group LIKE ?)';
      values.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY category, name';
    const [rows] = await db.execute(query, values);
    return rows;
  },

  // ---- Trouver un exercice par son id ----
  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM Exercise WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // ---- Créer un exercice ----
  async create({ name, category, muscle_group, description }) {
    const [result] = await db.execute(
      'INSERT INTO Exercise (name, category, muscle_group, description) VALUES (?, ?, ?, ?)',
      [name, category, muscle_group || null, description || null]
    );
    // On relit l'exercice créé depuis la BDD pour retourner l'objet complet
    // (avec l'id, created_at, etc.) plutôt que juste l'insertId
    return this.findById(result.insertId);
  },

  // ---- Mettre à jour un exercice (mise à jour partielle) ----
  async update(id, { name, category, muscle_group, description }) {
    // Même technique que UserModel.update : construction dynamique
    // pour ne modifier que les champs effectivement fournis
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (category !== undefined) { fields.push('category = ?'); values.push(category); }
    if (muscle_group !== undefined) { fields.push('muscle_group = ?'); values.push(muscle_group); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }

    // Aucun champ à modifier → on retourne l'existant sans toucher la BDD
    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await db.execute(`UPDATE Exercise SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  // ---- Supprimer un exercice ----
  async delete(id) {
    const [result] = await db.execute('DELETE FROM Exercise WHERE id = ?', [id]);

    // affectedRows indique combien de lignes ont été supprimées.
    // Si 0, l'exercice n'existait pas (ou est protégé par une contrainte FK).
    // La contrainte RESTRICT en BDD lèvera une erreur ER_ROW_IS_REFERENCED_2
    // si l'exercice est utilisé dans un WorkoutExercise (géré dans le contrôleur).
    return result.affectedRows > 0;
  },
};

module.exports = ExerciseModel;
