const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Expense = require('../models/Expense');

// Update salary
router.post('/salary', auth, async (req, res) => {
  try {
    const { salary } = req.body;
    await User.findByIdAndUpdate(req.userId, { salary });
    res.json({ message: 'Salary updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add expense
router.post('/expense', auth, async (req, res) => {
  try {
    const { description, amount } = req.body;
    const expense = new Expense({
      userId: req.userId,
      description,
      amount
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user data and expenses
router.get('/data', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const expenses = await Expense.find({ userId: req.userId });
    res.json({
      salary: user.salary,
      expenses
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 