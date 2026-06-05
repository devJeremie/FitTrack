const ExerciseModel = require('../models/exercise.model');

const VALID_CATEGORIES = ['Musculation', 'Cardio', 'Flexibilité'];

const ExerciseController = {
  async getAll(req, res) {
    try {
      const { category, search } = req.query;
      if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }
      const exercises = await ExerciseModel.findAll({ category, search });
      res.json({ exercises, count: exercises.length });
    } catch (err) {
      console.error('GetAll exercises error:', err);
      res.status(500).json({ error: 'Failed to fetch exercises.' });
    }
  },

  async getOne(req, res) {
    try {
      const exercise = await ExerciseModel.findById(req.params.id);
      if (!exercise) return res.status(404).json({ error: 'Exercise not found.' });
      res.json({ exercise });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch exercise.' });
    }
  },

  async create(req, res) {
    try {
      const { name, category, muscle_group, description } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name and category are required.' });
      }
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }

      const exercise = await ExerciseModel.create({ name, category, muscle_group, description });
      res.status(201).json({ message: 'Exercise created.', exercise });
    } catch (err) {
      console.error('Create exercise error:', err);
      res.status(500).json({ error: 'Failed to create exercise.' });
    }
  },

  async update(req, res) {
    try {
      const { name, category, muscle_group, description } = req.body;

      if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }

      const exercise = await ExerciseModel.findById(req.params.id);
      if (!exercise) return res.status(404).json({ error: 'Exercise not found.' });

      const updated = await ExerciseModel.update(req.params.id, { name, category, muscle_group, description });
      res.json({ message: 'Exercise updated.', exercise: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update exercise.' });
    }
  },

  async delete(req, res) {
    try {
      const exercise = await ExerciseModel.findById(req.params.id);
      if (!exercise) return res.status(404).json({ error: 'Exercise not found.' });

      const deleted = await ExerciseModel.delete(req.params.id);
      if (!deleted) return res.status(400).json({ error: 'Cannot delete exercise (may be in use by workouts).' });

      res.json({ message: 'Exercise deleted.' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ error: 'Cannot delete: exercise is used in one or more workouts.' });
      }
      res.status(500).json({ error: 'Failed to delete exercise.' });
    }
  },
};

module.exports = ExerciseController;
