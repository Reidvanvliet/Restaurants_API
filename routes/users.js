const express = require('express');
const { User } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.toSafeObject());
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update only provided fields
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    await user.update(updateData);

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      isAdmin: user.isAdmin
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      return res.status(400).json({ message: 'Cannot change password for OAuth accounts' });
    }

    // Verify current password
    const isMatch = await user.validatePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password (will be hashed by the model hook)
    await user.update({ password: newPassword });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password for non-OAuth users
    if (user.password && password) {
      const isMatch = await user.validatePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Password is incorrect' });
      }
    }

    // Soft delete: anonymize user data instead of actually deleting
    // This preserves order history while removing personal information
    await user.update({
      email: `deleted_${user.id}@goldchopsticks.local`,
      firstName: 'Deleted',
      lastName: 'User',
      phone: 'N/A',
      address: 'N/A',
      password: null,
      thirdPartyId: null,
      thirdPartyProvider: null
    });

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// @route   GET /api/users/admin/all
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    if (search) {
      const { Op } = require('sequelize');
      where = {
        [Op.or]: [
          { email: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      users: users.map(user => user.toSafeObject()),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// @route   PUT /api/users/admin/:id/role
// @desc    Update user role (admin only)
// @access  Private (Admin)
router.put('/admin/:id/role', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ message: 'Valid admin status is required' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent removing admin status from self
    if (req.user.id === parseInt(id) && !isAdmin) {
      return res.status(400).json({ message: 'Cannot remove admin status from yourself' });
    }

    await user.update({ isAdmin });

    res.json({
      message: 'User role updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

module.exports = router;