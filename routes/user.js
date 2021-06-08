const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User, Customer } = require('../models')
const config = require('../config');
const authService = require('../services/auth.service');

async function updateUser(req, res, next) {
  let user = await User.findOne({ where: { id: req.params.id } });
  if (!user) return res.status(400).json({
    success: false,
    message: 'No user found!'
  });
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.username = req.body.username;
  user.phone = req.body.phone;
  user.email = req.body.email;
  user.isActive = req.body.isActive;
  try {
    const response = await user.save();
    response.password = undefined
    return res.json({
      success: true,
      message: 'User updated',
      data: response
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
  }
}

/* POST user login. */
router.post('/auth/login', async (req, res, next) => {
  let loginKey = req.body.username.indexOf('@') > -1 ? 'email' : 'username';
  const user = await User.findOne({
    where: { [loginKey]: req.body.username },
    include: [{ model: Customer, as: 'Company' }]
  });
  if (!user)
    return res.status(401).json({
      success: false,
      message: 'User doesn\'t exist with this email!'
    });
  let isPasswordValid = user.comparePassword(req.body.password);
  if (!isPasswordValid) return res.status(401).json({
    success: false,
    message: 'Invalid password!'
  });
  if (!user.companyId) return res.status(401).json({
    status: false,
    message: 'User is not assigned to any company!'
  });
  var token = jwt.sign({ id: user.id }, config.JWT_SECRET, {
    expiresIn: 86400 // expires in 24 hours
  });
  res.json({
    success: isPasswordValid,
    message: 'Login successful',
    token
  });
});

/* GET current logged in user. */
router.get('/me', authService.isLoggedIn, async (req, res, next) => {
  return res.json({
    success: true,
    data: req.user
  })
});

router.put('/me', authService.isLoggedIn, async (req, res, next) => {
  req.params.id = req.userId;
  return next()
}, updateUser);

router.patch('/me/password', authService.isLoggedIn, async (req, res, next) => {
  req.params.id = req.userId;
  let user = await User.findOne({ where: { id: req.params.id } });
  if (!user) return res.status(400).json({
    success: false,
    message: 'No user found!'
  });
  let isPasswordValid = user.comparePassword(req.body.oldPassword);
  if (!isPasswordValid) return res.status(401).json({
    success: false,
    message: 'Invalid Old Password!'
  });
  user.password = req.body.password;
  try {
    const response = await user.save();
    response.password = undefined
    return res.json({
      success: true,
      message: 'User updated',
      data: response
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
