// backend/routes/users.js
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { User } = require('../models');
const router = express.Router();

// Get all users - Admin only
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // Don't send password data
      order: [['createdAt', 'DESC']], // Most recently created users first
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// If you need to get a specific user by ID
router.get('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
