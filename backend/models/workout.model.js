const db = require('../config/database');

const WorkoutModel = {
  async findAllByUser(userId) {
    const [rows] = await db.execute(
      `SELECT w.*,
        COUNT(we.id) as exercise_count
       FROM Workout w
       LEFT JOIN WorkoutExercise we ON w.id = we.workout_id
       WHERE w.user_id = ?
       GROUP BY w.id
       ORDER BY w.date DESC, w.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const [workouts] = await db.execute(
      'SELECT * FROM Workout WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!workouts[0]) return null;

    const [exercises] = await db.execute(
      `SELECT we.*, e.name, e.category, e.muscle_group
       FROM WorkoutExercise we
       JOIN Exercise e ON we.exercise_id = e.id
       WHERE we.workout_id = ?
       ORDER BY we.id`,
      [id]
    );

    return { ...workouts[0], exercises };
  },

  async create({ user_id, title, date, duration, notes }) {
    const [result] = await db.execute(
      'INSERT INTO Workout (user_id, title, date, duration, notes) VALUES (?, ?, ?, ?, ?)',
      [user_id, title, date, duration || null, notes || null]
    );
    return result.insertId;
  },

  async addExercise(workoutId, { exercise_id, sets, reps, weight_used, duration }) {
    const [result] = await db.execute(
      'INSERT INTO WorkoutExercise (workout_id, exercise_id, sets, reps, weight_used, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [workoutId, exercise_id, sets || null, reps || null, weight_used || null, duration || null]
    );
    return result.insertId;
  },

  async update(id, userId, { title, date, duration, notes }) {
    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (date !== undefined) { fields.push('date = ?'); values.push(date); }
    if (duration !== undefined) { fields.push('duration = ?'); values.push(duration); }
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
    if (fields.length === 0) return this.findById(id, userId);
    values.push(id, userId);
    await db.execute(`UPDATE Workout SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
    return this.findById(id, userId);
  },

  async delete(id, userId) {
    const [result] = await db.execute(
      'DELETE FROM Workout WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async getProgressionStats(userId) {
    const [totalStats] = await db.execute(
      `SELECT
        COUNT(DISTINCT w.id) as total_workouts,
        COALESCE(SUM(w.duration), 0) as total_minutes,
        COALESCE(AVG(w.duration), 0) as avg_duration,
        COUNT(DISTINCT we.exercise_id) as unique_exercises
       FROM Workout w
       LEFT JOIN WorkoutExercise we ON w.id = we.workout_id
       WHERE w.user_id = ?`,
      [userId]
    );

    const [monthlyStats] = await db.execute(
      `SELECT
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as workout_count,
        COALESCE(SUM(duration), 0) as total_minutes
       FROM Workout
       WHERE user_id = ?
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month DESC
       LIMIT 6`,
      [userId]
    );

    const [categoryStats] = await db.execute(
      `SELECT
        e.category,
        COUNT(we.id) as exercise_count,
        COALESCE(SUM(we.sets * we.reps), 0) as total_reps
       FROM WorkoutExercise we
       JOIN Exercise e ON we.exercise_id = e.id
       JOIN Workout w ON we.workout_id = w.id
       WHERE w.user_id = ?
       GROUP BY e.category`,
      [userId]
    );

    const [recentWorkouts] = await db.execute(
      `SELECT id, title, date, duration
       FROM Workout
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 5`,
      [userId]
    );

    return {
      summary: totalStats[0],
      monthly: monthlyStats,
      byCategory: categoryStats,
      recent: recentWorkouts,
    };
  },
};

module.exports = WorkoutModel;
