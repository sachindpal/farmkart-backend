import HttpStatus from "http-status-codes";
import authService from "../services/AuthService.js";
import { sendResponse } from "../../../middlewares/responseHandler.js";


/**
 * Registration created by @sachinpal .
 *
 * @param  {object} req
 * @param  {object} res
 * @param  {Object} next Next request.
 */
const signup = function( req, res, next ) {
    return authService
        .signup( req, next )
        .then( ( data ) => sendResponse( req, res, HttpStatus.OK, data ) )
        .catch( ( err ) => next( err ) );  
}; 


const login = function( req, res, next ) {
    
    return authService
        .login( req, next )
        .then( ( data ) => sendResponse( req, res, HttpStatus.OK, data ) )
        .catch( ( err ) => next( err ) );  
}; 


/**
 * Send otp created by @sachinpal .
 *
 * @param  {object} req
 * @param  {object} res
 * @param  {Object} next Next request.
 */

const sendOtp = (req,res,next)=>{
    return authService
        .sendOtp( req, next )
        .then( ( data ) => sendResponse( req, res, HttpStatus.OK, data ) )
        .catch( ( err ) => next( err ) ); 
}

const verifyOtp = (req,res,next)=>{
    return authService
    .verifyOtp(req,res,next)
    .then((data)=>sendResponse(req,res,HttpStatus.OK,data))
    .catch((err)=>next(err))
}


const forgetPassword = (req,res,next)=>{
    return authService
    .forgetPassword(req,res,next)
    .then((data)=>sendResponse(req,res,HttpStatus.OK,data))
    .catch((err)=>next(err))
}

const otpVerifyPassword = (req,res,next)=>{
    return authService
    .passwordOtpVerify(req,res,next)
    .then((data)=>sendResponse(req,res,HttpStatus.OK,data))
    .catch((err)=>next(err))
}


const Auth = {signup,sendOtp,login,verifyOtp,forgetPassword,otpVerifyPassword}
export default Auth