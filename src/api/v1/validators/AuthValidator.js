import Joi from "joi";
import validate from "./../../../utils/Validate.js";
import BaseModel from './../../../models/BaseModel.js'
import Boom from "boom";
import AWS from 'aws-sdk';
import fs from 'fs'
import authService from "../services/AuthService.js";


const commonModel = new BaseModel;


const SIGNUP_SCHEMA = {
    "mobile": Joi.number()
        .label("Mobile number")
        .required(),
    "full_name": Joi.string()
        .label("Full Name")
        .required(),
    "password": Joi.string()
        .label("Password")
        .required(),
    "state": Joi.number()
        .label("State")
        .required(),
    "district": Joi.number()
        .label("District")
        .required()
};

const OTP_VERIFY = {
    "otp": Joi.string()
        .label("OTP")
        .required(),
    "mobile": Joi.number()
        .label("Mobile number")
        .required(),

};

const LOGIN_SCHEMA = {
    "mobile": Joi.string()
        .label( "Number" )
        .regex(/^[0-9]{10}$/)
        .required(),
    "password": Joi.string()
        .label( "Password" )
        .required()
};


/**
 * Validate create/update user request.
 *
 * @param  {object}   req
 * @param  {object}   res
 * @param  {function} next
 * @returns {Promise}
 */
const signupValidation = function (req, res, next) {
    return validate(req.body, SIGNUP_SCHEMA)
        .then(() => next())
        .catch((err) => next(err));
};

/**
 * Validate create/update user request.
 *
 * @param  {object}   req
 * @param  {object}   res
 * @param  {function} next
 * @returns {Promise}
 */
const otpVerifyValidation = function (req, res, next) {
    return validate(req.body, OTP_VERIFY)
        .then(() => next())
        .catch((err) => next(err));
};

const checkMobileValidation = (req,res,next)=>{
    if(req.body.mobile==undefined || req.body.mobile.length!=10 || isNaN(req.body.mobile)){
        const data = { "error_code": "95" };
        throw Boom.badRequest('Invalid number', data);
    }else{
        next()
    }
}

const decodeReq = (req, res, next) => {

    for (let [key, value] of Object.entries(req.body)) {
        console.log(key, value);

        let bufferObj = Buffer.from(value, "base64");
        // Encode the Buffer as a utf8 string 
        let decodedString = bufferObj.toString("utf8");

        console.log("The decoded string:", decodedString);
        req.body[key] = decodedString;
    }
    console.log('req.body', req.body)
    next();

}

/**
 * Validate create/update user request.
 *
 * @param  {object}   req
 * @param  {object}   res
 * @param  {function} next
 * @returns {Promise}
 */
const checkDeviceToken = function (req, res, next) {
    if (!req.headers['device-token']) {
        const data = { "error_code": "79" };
        throw Boom.badRequest('Invalid headers', data);
    } else {
        next()
    }
};


/**
 * Validate create/update user request.
 *
 * @param  {object}   req
 * @param  {object}   res
 * @param  {function} next
 * @returns {Promise}
 */
const checkDeviceAndAuthToken = function (req, res, next) {
//   console.log(req.header('authorization').replace('Bearer ',''))
    if (!req.headers['device-token'] || !req.header('authorization')) {
        const data = { "error_code": "79" };
        throw Boom.badRequest('Invalid headers', data);
    } else {
        next()
    }
};


/**
 * Validate for mobile verified or not.
 *
 * @param  {object}   req
 * @param  {object}   res
 * @param  {function} next
 * @returns {Promise}
 */
const mobileCheck = async function (req, res, next) {

    await commonModel.fetchObj({ 'mobileno': req.body.mobile }, 'customer').then((data) => {
        if (data.length > 0) {
            const data = { "error_code": "80" };
            throw Boom.badRequest('User Exists ', data);
        }
        next()

    }).catch((err) => {
        next(err)
    })
};


/**
 * Validate for mobile verified or not.
 *
 * @param  {object}   req
 * @param  {object}   res
 * @param  {function} next
 * @returns {Promise}
 */
const mobileCheckVerified = async function (req, res, next) {

    await commonModel.fetchObj({ 'mobileno': req.body.mobile, 'verifymobile': 'Y' }, 'customer').then((data) => {
        if (data.length > 0) {
            const data = { "error_code": "91" };
            throw Boom.badRequest('Number already verified.', data);
        }
        next()

    }).catch((err) => {
        next(err)
    })
};

/**
 * Validate for mobile verified or not.
 *
 * @param  {object}   req
 * @param  {object}   res
 * @param  {function} next
 * @returns {Promise}
 */
const mobileExists = async function (req, res, next) {

    await commonModel.fetchObj({ 'mobileno': req.body.mobile, 'verifymobile': 'Y' }, 'customer').then((data) => {
        // console.log('data',data)
        if (data==undefined || data.length == 0) {
            const data = { "error_code": "93" };
            throw Boom.badRequest('Number not exist.', data);
        }
        next()

    }).catch((err) => {
        next(err)
    })
};


const otpLimitValidation = async (req, res, next) => {
    let json = 'dd';
    let s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })

    var params = { Bucket: process.env.AWS_BUCKET, Key: 'otpStorage.json' };


    //read file from s3
    await s3.getObject(params, async (err, data) => {
        if (err) {
            throw err;
        } else {

            json = data.Body.toString();
            json = JSON.parse(json);
            //condition for check max otp limit
            let max_array = [];
            let finalValue = await json.filter(val => val[req.body.mobile] != undefined);

            if (finalValue.length > 4) {
                const data = { "error_code": "85" };
                next(Boom.badRequest('Max otp limit', data));
            }

        }

    })
    next()

}

const loginValidation = function( req, res, next ) {
    return validate( req.body, LOGIN_SCHEMA )
        .then( () => next() )
        .catch( ( err ) => next( err ) );
};

const checkCustomerInFile = async (req, res, next) => {
    let json = 'dd';
    let s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })

    var params = { Bucket: process.env.AWS_BUCKET, Key: 'userSignupData.json' };


    //read file from s3
    await s3.getObject(params, async (err, data) => {
        if (err) {
            throw err;
        } else {

            json = data.Body.toString();
            if (json.length > 0) {
                json = JSON.parse(json);
                //condition for check max otp limit
                let max_array = [];
                let finalValue = await json.filter(val => val.mobileno == req.body.mobile);

                if (finalValue.length > 0) {
                    const data = { "error_code": "89" };
                    next(Boom.badRequest('user already exist.', data));
                } else {
                    next()
                }
            }else{
                next();
            }

        }

    })
    // next()

}

const checkUserInfoInFile = async (req, res, next) => {
    let json = 'dd';
    let s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })

    var params = { Bucket: process.env.AWS_BUCKET, Key: 'userSignupData.json' };


    //read file from s3
    await s3.getObject(params, async (err, data) => {
        if (err) {
            throw err;
        } else {

            json = data.Body.toString();
            if (json.length > 0) {
                json = JSON.parse(json);
                //condition for check max otp limit
                let max_array = [];
                let finalValue = await json.filter(val => val.mobileno == req.body.mobile);

                if (finalValue.length == 0) {
                    const data = { "error_code": "91" };
                    next(Boom.badRequest('user does not exist.', data));
                } else {
                    next()
                }
            }else{
                next();
            }

        }

    })
    // next()

}
const otpValidationInFile = async(req,res,next)=>{
    
    let json = 'dd';
    let s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })

    var params = { Bucket: process.env.AWS_BUCKET, Key: 'otpStorage.json' };
    const authToken =  req.header('authorization').replace('Bearer ','');
    const deviceToken = req.headers['device-token']

    //read file from s3
    return s3.getObject(params, async (err, data) => {
        if (err) {
            throw err;
        } else {

            json = data.Body.toString();
            json = JSON.parse(json);
            //condition for check max otp limit
            let max_array = [];
            let otpNotMatch = await json.filter(val => val[req.body.mobile] == req.body.otp);

            let authTokenNotMatch = await json.filter(val => val[req.body.mobile] == req.body.otp && val.deviceToken==deviceToken && val.authToken==authToken);
            


            if (otpNotMatch.length == 0) {
                const data = { "error_code": "101" };
                next(Boom.badRequest('OTP not matched', data));
            }

            if (authTokenNotMatch.length==0) {
                const data = { "error_code": "102" };
                next(Boom.badRequest('session expired.', data));
            }

        }
        next()
    })
    

}

const varifyOtpValidation = async (req,res,next)=>{
        const authToken =  req.header('authorization').replace('Bearer ','');
        const deviceToken = req.headers['device-token']
    
        const full_path = `caching/userSignupData.json`;
        let json =  fs.readFileSync(full_path, "utf8")
        if(json.length > 0){
            json = JSON.parse(json);
            
            //condition for check max otp limit
            let finalValue = await json.filter(val => val.mobileno == req.body.mobile);
            let otpArr = await json.filter(val => val[req.body.mobile]!=undefined);
            

            let authTokenNotMatch = await json.filter(val => val['device-token']==deviceToken && val.authToken==authToken);
    
            if (authTokenNotMatch.length==0) {
                const data = { "error_code": "102" };
                next(Boom.badRequest('session expired.', data));
            }
    
            if (finalValue.length == 0) {
                const data = { "error_code": "91" };
                next(Boom.badRequest('user does not exist.', data));
            }
            if (finalValue[0].wrongVerify.length > 4) {
                const data = { "error_code": "96" };
                next(Boom.badRequest('You already enter five times wrong otp', data));
            }
    
            let length = otpArr[0][req.body.mobile].length-1;
            if(otpArr[0][req.body.mobile][length]!=req.body.otp){

                //save the otp which is wrong for the validation
                
                for (let index = 0; index < json.length; index++) {
                    const element = json[index];
                    if(element.mobileno == req.body.mobile){
                        
                        element.wrongVerify.push(req.body.otp);
                    }
                    
                }
                await authService.updateJsonOnFile(json,'userSignupData.json');

                const data = { "error_code": "101" };
                next(Boom.badRequest('OTP not matched', data));
            }
            //create object with updated otp
            let updateValueIndb = await json.filter(val => val.mobileno == req.body.mobile);
            let updateValueInFile = await json.filter(val => val.mobileno != req.body.mobile);
            req.body.updateObj = updateValueIndb;
            req.body.updateValueInFile = updateValueInFile;
            next()
        }
    
 }

const validation = { signupValidation, mobileCheck, checkDeviceToken, decodeReq, otpLimitValidation, mobileCheckVerified, checkCustomerInFile,checkDeviceAndAuthToken,checkUserInfoInFile,checkMobileValidation,otpValidationInFile,otpVerifyValidation,loginValidation,varifyOtpValidation,mobileExists };
export default validation