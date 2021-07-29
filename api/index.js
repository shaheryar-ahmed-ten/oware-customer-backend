const express = require('express');
const router = express.Router();
const userRouter = require('./user');
const dashboardRouter = require('./dashboard');
const inwardRouter = require('./inward')
const orderRouter = require('./order')
const productRouter = require('./product')
const rideRouter = require('./ride')


const { isLoggedIn, checkPermission } = require('../services/auth.service');
const { PERMISSIONS } = require('../enums');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.json({
    success: true,
    message: 'Welcome!'
  });
});

router.use('/user', userRouter);
router.use('/dashboard', isLoggedIn, checkPermission(PERMISSIONS.CP_DASHBOARD_FULL), dashboardRouter);
router.use('/inward', isLoggedIn, checkPermission(PERMISSIONS.CP_INWARD_FULL), inwardRouter);
router.use('/order', isLoggedIn, checkPermission(PERMISSIONS.CP_ORDER_FULL), orderRouter);
router.use('/product', isLoggedIn, checkPermission(PERMISSIONS.CP_PRODUCT_FULL), productRouter);
router.use("/ride", isLoggedIn, checkPermission(PERMISSIONS.CP_RIDE_FULL),rideRouter)

module.exports = router;