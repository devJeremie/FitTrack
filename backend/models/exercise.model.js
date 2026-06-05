const db = require('../config/database');

const ExerciseModel = {
  async findAll({ category, search } = {}) {
    let query = 'SELECT * FROM Exercise WHERE 1=1';
    const values = [];
    if (category) {
      query += ' AND category = ?';
      values.push(category);
    }
    if (search) {
      query += ' AND (name LIKE ? OR muscle_group LIKE ?)';
      values.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY category, name';
    const [rows] = await db.execute(query, values);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM Exercise WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ name, category, muscle_group, description }) {
    const [result] = await db.execute(
      'INSERT INTO Exercise (name, category, muscle_group, description) VALUES (?, ?, ?, ?)',
      [name, category, muscle_group || null, description || null]
    );
    return this.findById(result.insertId);
  },

  async update(id, { name, category, muscle_group, description }) {
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (category !== undefined) { fields.push('category = ?'); values.push(category); }
    if (muscle_group !== undefined) { fields.push('muscle_group = ?'); values.push(muscle_group); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await db.execute(`UPDATE Exercise SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    const [result] = await db.execute('DELETE FROM Exercise WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = ExerciseModel;
