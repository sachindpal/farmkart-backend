
import express from 'express';
import createError from 'http-errors';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import logger from "./src/utils/Logger.js";
import dotenv from 'dotenv';
import {authRoutes} from './src/routes/api/v1/AuthRoutes.js';
import {appRoutes} from './src/routes/api/v1/AppConfigRouts.js';
import * as errorHandler from "./src/middlewares/ErrorHandler.js";

import multer  from 'multer';
import fileUpload from 'express-fileupload';
import DotEnv from 'dotenv';
DotEnv.config()

const APP_PORT = process.env.APP_PORT || "3000";
const APP_HOST = process.env.APP_HOST || "localhost";
// console.log('logger',logger)

var app = express();
app.use(fileUpload());
app.use('caching',express.static('caching/'))
// console.log('secrete',require('crypto').randomBytes(64).toString('hex'))

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, '.env')));
// app.use(multer)
app.use('/api/auth', authRoutes);
app.use('/api/app', appRoutes);

app.use( errorHandler.genericErrorHandler );
app.use( errorHandler.notFound );
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
dotenv.config();
// console.log('env',process.env.TOKEN_SECRET)

app.listen( APP_PORT, () => {
  console.log(`Server started at http://${APP_HOST}:${APP_PORT}` );
} );


process.on( "uncaughtException", ( err ) => {
  // console.log('errfffffffffffff',logger)
  console.log('err',err)
  logger.error( err.message );
} );

process.on( "unhandledRejection", ( reason ) => {
  console.log('err',reason)

  logger.error( reason );
} );

 export default app;
