const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const AuthController = {
  async register(req, res) {
    try {
      const { username, email, password, weight, goal } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email and password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }

      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: 'Email already in use.' });
      }

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken.' });
      }

      const userId = await UserModel.create({ username, email, password, weight, goal });
      const user = await UserModel.findById(userId);
      const token = generateToken(user);

      res.status(201).json({
        message: 'Account created successfully.',
        token,
        user,
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Failed to create account.' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const isValid = await UserModel.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user);

      res.json({
        message: 'Login successful.',
        token,
        user: userWithoutPassword,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed.' });
    }
  },

  async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch profile.' });
    }
  },
};

module.exports = AuthController;
