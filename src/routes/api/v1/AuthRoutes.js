
import Auth from '../../../api/v1/controllers/AuthController.js';
import Router  from 'express';
import validation from '../../../api/v1/validators/AuthValidator.js'

const authRoutes = new Router();

authRoutes.post( "/signup" ,
   // validation.decodeReq,
   validation.checkDeviceToken,     // for headers 
   validation.signupValidation,
   validation.checkMobileValidation,
   validation.mobileCheck,
   validation.checkCustomerInFile,
   Auth.signup
);

authRoutes.post( "/login" ,
   // validation.decodeReq,
   validation.checkDeviceToken,     // for headers 
   validation.loginValidation,
   validation.checkMobileValidation,
   Auth.login
);

authRoutes.post( "/send-otp" ,
   // validation.decodeReq,
   validation.checkDeviceAndAuthToken,
   validation.checkMobileValidation,
   validation.mobileCheckVerified,
   Auth.sendOtp
);

authRoutes.post( "/verify-otp" ,
   // validation.decodeReq,
   validation.checkDeviceAndAuthToken,
   validation.otpVerifyValidation,
   validation.checkMobileValidation,
   validation.mobileCheckVerified,
   validation.varifyOtpValidation,
   Auth.verifyOtp
);

authRoutes.post( "/forget-password" ,
   // validation.decodeReq,
   validation.checkDeviceToken,
   validation.checkMobileValidation,
   validation.mobileExists,
   Auth.forgetPassword
);

authRoutes.post( "/password-otp-verify" ,
   // validation.decodeReq,
   validation.checkDeviceToken,
   validation.otpVerifyValidation,
   validation.checkMobileValidation,
   Auth.otpVerifyPassword
);


export {authRoutes}