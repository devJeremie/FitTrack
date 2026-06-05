const WorkoutModel = require('../models/workout.model');
const UserModel = require('../models/user.model');

const StatsController = {
  async getProgression(req, res) {
    try {
      const [stats, user] = await Promise.all([
        WorkoutModel.getProgressionStats(req.user.id),
        UserModel.findById(req.user.id),
      ]);

      res.json({
        user: {
          username: user.username,
          weight: user.weight,
          goal: user.goal,
          member_since: user.created_at,
        },
        stats,
      });
    } catch (err) {
      console.error('Stats error:', err);
      res.status(500).json({ error: 'Failed to fetch stats.' });
    }
  },
};

module.exports = StatsController;
