const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../config/database', () => ({
  execute: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  query: jest.fn(),
}));

jest.mock('../models/exercise.model', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

const app = require('../server');
const ExerciseModel = require('../models/exercise.model');

const authHeader = () => ({
  Authorization: `Bearer ${jwt.sign(
    { id: 1, email: 'test@example.com', username: 'testuser' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )}`,
});

const BASE_EXERCISE = {
  id: 1,
  name: 'Squat',
  category: 'Musculation',
  muscle_group: 'Jambes',
  description: 'Exercice de base pour les jambes',
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('Exercise Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/exercises', () => {
    it('retourne la liste des exercices (200)', async () => {
      ExerciseModel.findAll.mockResolvedValue([BASE_EXERCISE]);

      const res = await request(app)
        .get('/api/exercises')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('exercises');
      expect(res.body).toHaveProperty('count', 1);
      expect(res.body.exercises[0].name).toBe('Squat');
    });

    it('retourne 401 sans token', async () => {
      const res = await request(app).get('/api/exercises');

      expect(res.status).toBe(401);
    });

    it('retourne 400 pour une catégorie invalide', async () => {
      const res = await request(app)
        .get('/api/exercises?category=InvalidCategory')
        .set(authHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Category must be one of');
    });

    it('accepte les catégories valides', async () => {
      ExerciseModel.findAll.mockResolvedValue([]);

      for (const cat of ['Musculation', 'Cardio', 'Flexibilité']) {
        const res = await request(app)
          .get(`/api/exercises?category=${encodeURIComponent(cat)}`)
          .set(authHeader());

        expect(res.status).toBe(200);
      }
    });
  });

  describe('POST /api/exercises', () => {
    it('crée un exercice avec succès (201)', async () => {
      ExerciseModel.create.mockResolvedValue(BASE_EXERCISE);

      const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ name: 'Squat', category: 'Musculation', muscle_group: 'Jambes' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Exercise created.');
      expect(res.body.exercise.name).toBe('Squat');
    });

    it('retourne 400 si name manquant', async () => {
      const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ category: 'Musculation' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Name and category are required.');
    });

    it('retourne 400 si category manquante', async () => {
      const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ name: 'Squat' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Name and category are required.');
    });

    it('retourne 400 si catégorie invalide', async () => {
      const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ name: 'Test', category: 'InvalidCat' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Category must be one of');
    });
  });

  describe('PUT /api/exercises/:id', () => {
    it('modifie un exercice avec succès (200)', async () => {
      const updated = { ...BASE_EXERCISE, name: 'Squat modifié' };
      ExerciseModel.findById.mockResolvedValue(BASE_EXERCISE);
      ExerciseModel.update.mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/exercises/1')
        .set(authHeader())
        .send({ name: 'Squat modifié', category: 'Musculation' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Exercise updated.');
      expect(res.body.exercise.name).toBe('Squat modifié');
    });

    it("retourne 404 si l'exercice n'existe pas", async () => {
      ExerciseModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/exercises/999')
        .set(authHeader())
        .send({ name: 'Test', category: 'Cardio' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Exercise not found.');
    });

    it('retourne 400 si catégorie invalide lors de la modification', async () => {
      const res = await request(app)
        .put('/api/exercises/1')
        .set(authHeader())
        .send({ category: 'Invalide' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/exercises/:id', () => {
    it('supprime un exercice avec succès (200)', async () => {
      ExerciseModel.findById.mockResolvedValue(BASE_EXERCISE);
      ExerciseModel.delete.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/exercises/1')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Exercise deleted.');
    });

    it("retourne 404 si l'exercice n'existe pas", async () => {
      ExerciseModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/exercises/999')
        .set(authHeader());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Exercise not found.');
    });

    it("retourne 409 si l'exercice est utilisé dans une séance", async () => {
      ExerciseModel.findById.mockResolvedValue(BASE_EXERCISE);
      const fkError = new Error('FK constraint');
      fkError.code = 'ER_ROW_IS_REFERENCED_2';
      ExerciseModel.delete.mockRejectedValue(fkError);

      const res = await request(app)
        .delete('/api/exercises/1')
        .set(authHeader());

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Cannot delete: exercise is used in one or more workouts.');
    });
  });
});
