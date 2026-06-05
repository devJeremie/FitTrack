const express = require('express');
const router = express.Router();
const ExerciseController = require('../controllers/exercise.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All exercise routes are protected
router.use(authMiddleware);

// GET /api/exercises?category=Musculation&search=squat
router.get('/', ExerciseController.getAll);

// GET /api/exercises/:id
router.get('/:id', ExerciseController.getOne);

// POST /api/exercises
router.post('/', ExerciseController.create);

// PUT /api/exercises/:id
router.put('/:id', ExerciseController.update);

// DELETE /api/exercises/:id
router.delete('/:id', ExerciseController.delete);

module.exports = router;
