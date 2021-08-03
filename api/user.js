const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User, Company, Role, VerificationCode } = require('../models')
const { sendForgotPasswordOTPEmail } = require('../services/mailer.service');
const { generateOTP } = require('../services/common.services');
const config = require('../config');
const authService = require('../services/auth.service');
const { APPS } = require('../enums');
const moment = require('moment');

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
      message: 'Your profile data updated successfully',
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
    include: [{ model: Company, as: 'Company' }, Role]
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
  if (user.Role.allowedApps.split(',').indexOf(APPS.CUSTOMER) < 0)
    return res.status(401).json({
      status: false,
      message: 'Not allowed to enter customer portal'
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
  if (!user) return res.json({
    success: false,
    message: 'No user found!'
  });
  let isPasswordValid = user.comparePassword(req.body.oldPassword);
  if (!isPasswordValid) return res.json({
    success: false,
    message: 'Invalid Old Password!'
  });
  user.password = req.body.password;
  try {
    const response = await user.save();
    response.password = undefined
    return res.json({
      success: true,
      message: 'Your profile data updated successfully',
      data: response
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message
    });
  }
});

/* POST forgot password. */
router.post('/auth/forgot-password', async (req, res, next) => {
  const user = await User.findOne({ where: { email: req.body.email } });
  if (!user) return res.status(400).json({
    success: false,
    message: 'User doesn\'t exist with this email'
  });
  if (!user.isActive) return res.status(400).json({
    success: false,
    message: 'User is inactive'
  });
  const otp = generateOTP();
  await VerificationCode.create({
    userId: user.id,
    code: otp,
    identity: user.id,
    expiryDate: moment().add(1, 'hour').toDate()
  });

  sendForgotPasswordOTPEmail({
    email: req.body.email, otp,
    name: `${user.firstName} ${user.lastName}`,
    link: `${req.get('referrer')}forgot-password/change-password/${user.id}/${otp}`
  });
  return res.json({
    success: true,
    message: 'Forgot password email sent!'
  });
});

/* POST update password. */
router.post('/auth/change-password/:id/:otp', async (req, res, next) => {
  const user = await User.findOne({ where: { id: req.params.id } });
  if (!user) return res.status(400).json({
    success: false,
    message: 'User doesn\'t exist with this email'
  });
  if (!user.isActive) return res.status(400).json({
    success: false,
    message: 'User is inactive'
  });
  let code = await VerificationCode.findOne({ where: { code: req.params.otp, identity: req.params.id } });
  if (!code) return res.status(401).json({
    success: false,
    message: 'Invalid otp'
  })
  user.password = req.body.password;
  user.save();
  await VerificationCode.destroy({ where: { identity: req.params.id } });
  return res.json({
    success: true,
    message: 'Your profile data updated successfully'
  });
});

module.exports = router;
