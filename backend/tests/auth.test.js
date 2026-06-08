const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../config/database', () => ({
  execute: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  query: jest.fn(),
}));

jest.mock('../models/user.model', () => ({
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findByUsername: jest.fn(),
  verifyPassword: jest.fn(),
  update: jest.fn(),
}));

const app = require('../server');
const UserModel = require('../models/user.model');

const BASE_USER = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  weight: null,
  goal: 'maintain',
  created_at: '2024-01-01T00:00:00.000Z',
};

const generateToken = (payload = {}) =>
  jwt.sign(
    { id: 1, email: 'test@example.com', username: 'testuser', ...payload },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('crée un compte avec succès (201)', async () => {
      UserModel.findByEmail.mockResolvedValue(null);
      UserModel.findByUsername.mockResolvedValue(null);
      UserModel.create.mockResolvedValue(1);
      UserModel.findById.mockResolvedValue(BASE_USER);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.message).toBe('Account created successfully.');
    });

    it('retourne 400 si username manquant', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username, email and password are required.');
    });

    it('retourne 400 si email manquant', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username, email and password are required.');
    });

    it('retourne 400 si mot de passe < 6 caractères', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Password must be at least 6 characters.');
    });

    it('retourne 409 si email déjà utilisé', async () => {
      UserModel.findByEmail.mockResolvedValue(BASE_USER);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already in use.');
    });

    it('retourne 409 si username déjà pris', async () => {
      UserModel.findByEmail.mockResolvedValue(null);
      UserModel.findByUsername.mockResolvedValue({ id: 2 });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'new@example.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Username already taken.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('connecte avec succès (200)', async () => {
      const userWithPassword = { ...BASE_USER, password: 'hashed_password' };
      UserModel.findByEmail.mockResolvedValue(userWithPassword);
      UserModel.verifyPassword.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.message).toBe('Login successful.');
    });

    it('retourne 400 si champs manquants', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email and password are required.');
    });

    it('retourne 401 si email inexistant', async () => {
      UserModel.findByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials.');
    });

    it('retourne 401 si mot de passe incorrect', async () => {
      const userWithPassword = { ...BASE_USER, password: 'hashed_password' };
      UserModel.findByEmail.mockResolvedValue(userWithPassword);
      UserModel.verifyPassword.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials.');
    });
  });

  describe('GET /api/auth/me', () => {
    it('retourne le profil avec un token valide (200)', async () => {
      UserModel.findById.mockResolvedValue(BASE_USER);
      const token = generateToken();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('retourne 401 sans token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('retourne 401 avec un token invalide', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });
});
