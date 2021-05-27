const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const authService = require('./services/auth.service');
const mailer = require('./services/mailer.service')
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
//const publicRouter = require('./routes/public');
//const customerRouter = require('./routes/customer');
const categoryRouter = require('./routes/category');
const uomRouter = require('./routes/uom');
const brandRouter = require('./routes/brand');
const warehouseRouter = require('./routes/warehouse');
const productRouter = require('./routes/product');
const productInwardRouter = require('./routes/productInward');
const dispatchOrderRouter = require('./routes/dispatchOrder');
const productOutwardRouter = require('./routes/productOutward');
const inventoryRouter = require('./routes/inventory');
//const customerInquiryRouter = require('./routes/customerInquiry');



const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1/', indexRouter);
app.use('/api/v1/user', userRouter);
//app.use('/api/v1/public', publicRouter);
//app.use('/api/v1/customer', authService.isLoggedIn, customerRouter);
app.use('/api/v1/category', authService.isLoggedIn, categoryRouter);
//app.use('/api/v1/customer-inquiry', authService.isLoggedIn, customerInquiryRouter);
app.use('/api/v1/uom', authService.isLoggedIn, uomRouter);
app.use('/api/v1/brand', authService.isLoggedIn, brandRouter);
app.use('/api/v1/warehouse', authService.isLoggedIn, warehouseRouter);
app.use('/api/v1/product', authService.isLoggedIn, productRouter);
app.use('/api/v1/product-inward', productInwardRouter);//authService.isLoggedIn
app.use('/api/v1/dispatch-order', authService.isLoggedIn, dispatchOrderRouter);
app.use('/api/v1/product-outward', authService.isLoggedIn, productOutwardRouter);
app.use('/api/v1/inventory', authService.isLoggedIn, inventoryRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use('/api/v1', function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    success: false,
    message: 'error'
  });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.redirect('/');
});

module.exports = app;
