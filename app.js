const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const { isLoggedIn, checkPermission } = require('./services/auth.service');
const { syncPermissions } = require('./services/permission.service');
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const dashboardRouter = require('./routes/dashboard');
const inwardRouter = require('./routes/inward')
const orderRouter = require('./routes/order')

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
app.use('/api/v1/dashboard', isLoggedIn, dashboardRouter);
app.use('/api/v1/inward', isLoggedIn, inwardRouter);

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

syncPermissions();

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.redirect('/');
});

module.exports = app;
