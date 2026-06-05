const WorkoutModel = require('../models/workout.model');

const WorkoutController = {
  async getAll(req, res) {
    try {
      const workouts = await WorkoutModel.findAllByUser(req.user.id);
      res.json({ workouts, count: workouts.length });
    } catch (err) {
      console.error('GetAll workouts error:', err);
      res.status(500).json({ error: 'Failed to fetch workouts.' });
    }
  },

  async getOne(req, res) {
    try {
      const workout = await WorkoutModel.findById(req.params.id, req.user.id);
      if (!workout) return res.status(404).json({ error: 'Workout not found.' });
      res.json({ workout });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch workout.' });
    }
  },

  async create(req, res) {
    try {
      const { title, date, duration, notes, exercises } = req.body;

      if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required.' });
      }

      const workoutId = await WorkoutModel.create({
        user_id: req.user.id,
        title,
        date,
        duration,
        notes,
      });

      if (Array.isArray(exercises) && exercises.length > 0) {
        for (const ex of exercises) {
          if (!ex.exercise_id) continue;
          await WorkoutModel.addExercise(workoutId, ex);
        }
      }

      const workout = await WorkoutModel.findById(workoutId, req.user.id);
      res.status(201).json({ message: 'Workout created.', workout });
    } catch (err) {
      console.error('Create workout error:', err);
      res.status(500).json({ error: 'Failed to create workout.' });
    }
  },

  async update(req, res) {
    try {
      const { title, date, duration, notes } = req.body;

      const existing = await WorkoutModel.findById(req.params.id, req.user.id);
      if (!existing) return res.status(404).json({ error: 'Workout not found.' });

      const workout = await WorkoutModel.update(req.params.id, req.user.id, { title, date, duration, notes });
      res.json({ message: 'Workout updated.', workout });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update workout.' });
    }
  },

  async delete(req, res) {
    try {
      const deleted = await WorkoutModel.delete(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ error: 'Workout not found.' });
      res.json({ message: 'Workout deleted.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete workout.' });
    }
  },
};

module.exports = WorkoutController;
