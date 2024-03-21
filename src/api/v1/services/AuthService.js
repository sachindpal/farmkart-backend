import BaseModel from './../../../models/BaseModel.js'
import AWS from 'aws-sdk';
import fs from 'fs'
import Security from './../../../libraries/Security.js'
import password from "./../../../utils/Password.js";
import Telemetry from "./../../../utils/Telemetry.js";
import Boom from "boom";
import axios from "axios";
import path from 'path';
import CommonConstant from '../../../constants/CommonConstant.js';
import { Worker } from 'worker_threads';
const commonModel = new BaseModel;

/**
 * Registration service by @sachinpal .
 *
 * @param  {object} req
 * @param  {object} res
 * @param  {Object} next Next request.
 */

const signup = async (req, res, next) => {

    const appSessionId = req.header('appSessionId');
    const apiName = 'signup';

    const telemetryObj = new Telemetry(appSessionId, apiName);

    try {

        telemetryObj.addRequest(req.body);

        let hashPassword = password.cryptPassword(req.body.password)

        const response = { "data": {} };
        // send the otp to user and and save data in DB
        let creatObject = {
            'fullname': req.body.full_name,
            'mobileno': req.body.mobile,
            'password': hashPassword,
            'device-token': req.headers['device-token'],
            'timestamp': Date.now(),
            'stateid': req.body.state,
            'districtid': req.body.district,
            'wrongVerify': [],
        }

        //create authtoken
        let authData = {
            'customerid': req.body.mobile
        }

        let authToken = Security.getUserAuthToken(authData)

        creatObject.authToken = authToken;

        const otp = getOtp();

        creatObject[req.body.mobile] = [otp];

        return await checkFile(req, creatObject, 'userSignupData.json').then((res) => {
            sendMsg(req, otp)
            response.data.token = authToken;
            telemetryObj.addResponse(response);
            telemetryObj.uploadTelemetry();
            return response;
        })

    } catch (err) {
        telemetryObj.addError(err.output.payload);
        telemetryObj.uploadTelemetry();
        throw err;
    }


}

//function for getting the
const getOtp = () => {
    return Math.floor(1000 + Math.random() * 9000);
}



// Make request
const sendMsg = (req, otp,msg='') => {
    const mobileno = req.body.mobile;
    // const mobileno = '9926811614';
    let message = msg
    if(message=''){
         message = `${otp}  ${CommonConstant.OTP_MESSAGES}`;
    }

    axios
        .get(`https://api.paasoo.com/json?key=${process.env.SMS_KEY}&secret=${process.env.SMS_SECRETE}&from=${process.env.SMS_FROM}&to=91${mobileno}&text=encodeURI(${message})`)
        // Show response data
        .then((res) => console.log('kkkk', res.data))
        .catch((err) => console.log(err));
}


const login = (async (req, res, next) => {

    const appSessionId = req.header('appSessionId');
    const apiName = 'login';

    const telemetryObj = new Telemetry(appSessionId, apiName);

    try {

        telemetryObj.addRequest(req.body);

        const response = { "data": {} };

        // First, we need to check if the user's mobile number is present in our staging area (userSignupData) or not.
        const full_path = 'userSignupData.json';
        let isUserInStaging = false;
        let json = readFile(req, full_path);
        if (json.length > 0) {
            json = JSON.parse(json);
            for (let index = 0; index < json.length; index++) {
                const element = json[index];
                if (element['mobileno'] == req.body.mobile) {
                    isUserInStaging = true;
                    // Check if the password also matches.
                    if (element['mobileno'] == req.body.password) {
                        response.data.isOtpVerified = false;
                        response.data.message = "Please verify or resend the OTP."
                    }
                    else {
                        const data = { "error_code": "Incorrect_password" };
                        throw Boom.badRequest('Incorrect password', data);
                    }
                    break;
                }
            }
        }

        // If the user is not found in the staging area, we need to check the database.
        if (isUserInStaging == false) {
            await commonModel.fetchObj({ 'mobileno': req.body.mobile }, 'customer').then(async (data) => {
                if (data.length > 0) {
                    // User found in our DB!
                    const match = password.compare(req.body.password, data[0].password);
                    if (match) {
                        // Create auth token!
                        let authData = {
                            'customerid': data[0].customerid
                        }
                        // Update the token in the DB.
                        let authToken = Security.getUserAuthToken(authData)
                        await commonModel.updateObj({ 'token': authToken }, { 'customerid': data[0].customerid }, 'customer');
                        response.data.isOtpVerified = true;
                        response.data.message = 'Login successful!';
                        response.data.token = authToken;
                    } else {
                        const data = { "error_code": "Incorrect_password" };
                        throw Boom.badRequest('Incorrect password', data);
                    }
                } else {
                    // User Not Found in our DB!
                    const data = { "error_code": "INVALID_USER" };
                    throw Boom.badRequest('No user found', data);
                }
            })
        }

        // Store telemetry if everything works well.
        telemetryObj.addResponse(response);
        telemetryObj.uploadTelemetry();
        return response;

    } catch (err) {
        // Storing telemetry in case we encounter exceptions.
        telemetryObj.addError(err.output.payload);
        telemetryObj.uploadTelemetry();
        throw err
    }
})



/**
 * Send otp service by @sachinpal .
 *
 * @param  {object} req
 * @param  {object} res
 * @param  {Object} next Next request.
 */
const sendOtp = async (req, res, next) => {

    const appSessionId = req.header('appSessionId');
    const apiName = 'sendOtp';

    const telemetryObj = new Telemetry(appSessionId, apiName);

    telemetryObj.addRequest(req.body);

    return validationForSendOtp(req, 'userSignupData.json').then(() => {
        const response = { "data": {} };
        response.data.message = 'OTP sent to the user successfully!';
        telemetryObj.addResponse(response);
        telemetryObj.uploadTelemetry();
        return response;
    }).catch((err) => {
        telemetryObj.addError(err.output.payload);
        telemetryObj.uploadTelemetry();
        throw err
    })
}

const checkFile = async (req, obj, fileName) => {
    var array = [];
    const full_path = `caching/${fileName}`;

    let json = await readFile(req, fileName)
    console.log('json', json)
    if (json.length > 0) {
        json = JSON.parse(json);


        //condition for check max otp limit
        let finalValue = await json.filter(val => val.mobileno == req.body.mobile);

        if (finalValue.length > 0) {
            const data = { "error_code": "89" };
            throw Boom.badRequest('user already exist.', data);
        } else {
            json.push(obj);
            updateJsonOnFile(json, full_path)
            return true

        }
    } else {
        array.push(obj);
        updateJsonOnFile(array, full_path)
        return true
    }

}

const validationForSendOtp = async (req, fileName) => {
    const authToken = req.header('authorization').replace('Bearer ', '');
    const deviceToken = req.headers['device-token']

    let json = readFile(req, fileName)

    if (json.length > 0) {
        json = JSON.parse(json);

        //condition for check max otp limit
        let finalValue = await json.filter(val => val.mobileno == req.body.mobile);
        let otpArr = await json.filter(val => val[req.body.mobile] != undefined);

        let authTokenNotMatch = await json.filter(val => val['device-token'] == deviceToken && val.authToken == authToken);

        if (otpArr[0][req.body.mobile].length > 2) {
            const data = { "error_code": "103" };
            throw Boom.badRequest('otp limit exceeds', data);
        }

        if (authTokenNotMatch.length == 0) {
            const data = { "error_code": "102" };
            throw Boom.badRequest('session expired.', data);
        }

        if (finalValue.length == 0) {
            const data = { "error_code": "91" };
            throw Boom.badRequest('user does not exist.', data);
        }

        //create object with updated otp
        const updatedOtp = getOtp()
        for (let index = 0; index < json.length; index++) {
            const element = json[index];
            console.log('element', element[req.body.mobile]);
            if (element[req.body.mobile] != undefined) {
                element[req.body.mobile].push(updatedOtp);
            }

        }
        const full_path = `caching/userSignupData.json`;

        // getOtp();
        updateJsonOnFile(json,full_path);
        sendMsg(req,updatedOtp);

    }

}

const readFile = async (req, fileName) => {
    // let json;
    const full_path = `caching/${fileName}`;
    let json = fs.readFileSync(full_path, "utf8")
    return json;


}

const updateJsonOnFile = (obj, fileName) => {
    const WriteWorker = new Worker(`${import.meta.dirname}/WriteFile.js`, {
        workerData: { fileName: fileName, obj: obj }
    });
    return WriteWorker.on('message', data => data);

}


const verifyOtp = async (req, res, next) => {
    const userData = req.body.updateObj
    const response = { "data": {} };
    const customerObj = {
        'fullname': userData[0].fullname,
        'mobileno': userData[0].mobileno,
        'password': userData[0].password,
        'verifymobile': 'Y',
        'verifyotp': req.body.otp,
        'eapptokan': req.headers['device-token'],

    }

    return await commonModel.createObj(customerObj, 'customer').then(async (custId) => {
        const addressObj = {
            'customerid': custId,
            'name': userData[0].fullname,
            'stateid': userData[0].stateid,
            'districtid': userData[0].districtid,
        }

        return await commonModel.createObj(addressObj, 'address').then(async(addresid) => {
            let authData = {
                'customerid': custId
            }

            return await commonModel.createObj(customerObj, 'customer').then(async (custId) => {
                const addressObj = {
                    'customerid': custId,
                    'name': userData[0].fullname,
                    'stateid': userData[0].stateid,
                    'districtid': userData[0].districtid,
                }

                return await commonModel.createObj(addressObj, 'address').then((addresid) => {
                    let authData = {
                        'customerid': custId
                    }

                    let authToken = Security.getUserAuthToken(authData)
                   return commonModel.updateObj({ 'token': authToken }, { 'customerid': custId }, 'customer').then((res) => {
                    const full_path = `caching/userSignupData.json`;
                        updateJsonOnFile(req.body.updateValueInFile,full_path)
                        response.data.token = authToken;
                        return response;


                    }).catch((err) => {
                        throw err
                    })

                }).catch((err) => {
                    throw err
                })




            }).catch((err) => {
                throw err
            })

        }).catch((err) => {
            throw err
        })




    }).catch((err) => {
        throw err
    })

}

/**
 * App conf service by @sachinpal .
 *
 * @param  {object} req
 * @param  {object} res
 * @param  {Object} next Next request.
 */

const appConfig = async (req, res, next) => {
    const response = { "data": {} };
    //hashing password
    try {
        return commonModel.fetchAll('appConfig').then((data) => {
            response.data = data;
            return response;
        })
    } catch (err) {
        throw err;

    }
}

/**
 * Forget password service by @sachinpal .
 *
 * @param  {object} req
 * @param  {object} res
 * @param  {Object} next Next request.
 */

const forgetPassword = async (req, res, next) => { 
    const response = { "data": {} };
    //hashing password
    const otp = getOtp();
    const full_path = `caching/passwordOtp.json`;
    try{
        let json = await readFile(req,'passwordOtp.json')
    
        if(json.length > 0){
            json = JSON.parse(json);
            const numberExist = json.filter((val)=>val[req.body.mobile]!=undefined);
            
            if(numberExist.length !=0 && numberExist[0][req.body.mobile].length > 2 && req.headers['device-token']==numberExist[0].deviceToken){
                const data = { "error_code": "81" };
                throw Boom.badRequest('OTP send time limit exist', data);
            }
            
                for (let index = 0; index < json.length; index++) {
                    const element = json[index];
                    if(element[req.body.mobile]!=undefined){
                        if(req.headers['device-token']!=element.deviceToken){
                            element.deviceToken = req.headers['device-token'];
                            element[req.body.mobile] = [otp]

                        }else{
                            element[req.body.mobile].push(otp)
                        }
                        
                    }
                    
                }

                if(numberExist.length == 0){
                    json.push({[req.body.mobile]:[otp],deviceToken:req.headers['device-token'],'timestamp': Date.now(),})
                }
        }else{
            json = [];
            json.push({[req.body.mobile]:[otp],deviceToken:req.headers['device-token'],'timestamp': Date.now(),})
        }

        // console.log('json',json)
        updateJsonOnFile(json,full_path)
        sendMsg(req,otp,CommonConstant.PASSWORD_OTP_MESSAGE);
        return response;
    }catch(err){
        throw err;
        
    }
}



/**
 * password otp verify service by @sachinpal .
 *
 * @param  {object} req
 * @param  {object} res
 * @param  {Object} next Next request.
 */

const passwordOtpVerify = async (req, res, next) => { 
    const response = { "data": {} };
    //hashing password
    const full_path = `caching/passwordOtp.json`;
    try{
        let json = await readFile(req,'passwordOtp.json')
    
        if(json.length > 0){
            json = JSON.parse(json);
            const numberExist = json.filter((val)=>val[req.body.mobile]!=undefined);
            const updateData = json.filter((val)=>val[req.body.mobile]==undefined);
// console.log('updateData',updateData)
            
            // return
            if(numberExist==0){
                const data = { "error_code": "88" };
                throw Boom.badRequest('Number does not exist', data);
            }

            const otpExist = numberExist[0][req.body.mobile][numberExist[0][req.body.mobile].length-1];
            // console.log(otpExist);
            


            if(otpExist!=req.body.otp){
                const data = { "error_code": "81" };
                throw Boom.badRequest('OTP not matched', data);
            }

            if(req.headers['device-token']!=numberExist[0].deviceToken){
                const data = { "error_code": "81" };
                throw Boom.badRequest('Session expired', data);
            }

           return await commonModel.fetchFirstObj({'mobileno':req.body.mobile},'customer').then(async(customerData)=>{
                let authTokenData = {
                    'customerid': customerData.customerid
                }

               await commonModel.updateObj({'forgot_otp':req.body.otp},{'customerid':customerData.customerid},'customer');

            let authToken = Security.getUserAuthToken(authTokenData)
            updateJsonOnFile(updateData,full_path)
            response.data.token = authToken;
            return response;
                
            }).catch((err)=>{
                throw err
            })

            
 
        }else{
            const data = { "error_code": "88" };
                throw Boom.badRequest('Number does not exist', data);
        }

    }catch(err){
        throw err;
        
    }
}


/**
 * create password service by @sachinpal .
 *
 * @param  {object} req
 * @param  {object} res
 * @param  {Object} next Next request.
 */

const createPassword = async (req, res, next) => { 
    const response = { "data": {} };
    const authToken = req.header('authorization').replace('Bearer ', '');

    try{



        const userObj = Security.verifyToken(authToken);
        console.log(userObj);


        //check if user verified otp or not
        const userData = await commonModel.fetchFirstObj({'customerid':userObj.customerid},'customer');

        if(!userData.forgot_otp){
            const data = { "error_code": "75" };
            throw Boom.badRequest("User not veried otp for forget password.", data);
        }


        let hashPassword = password.cryptPassword(req.body.password)

        await commonModel.updateObj({'password':hashPassword,'forgot_otp':null},{'customerid':userObj.customerid},'customer');
        return response;

    }catch(err){
        const data = { "error_code": "81" };
        throw Boom.badRequest(err, data);
        
        
    }
}

const authService = { signup, sendOtp, verifyOtp,login,updateJsonOnFile,appConfig, forgetPassword,passwordOtpVerify,createPassword};
export default authService;