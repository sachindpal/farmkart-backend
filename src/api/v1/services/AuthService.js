import BaseModel from './../../../models/BaseModel.js'
import AWS from 'aws-sdk';
import fs from 'fs'
import Security from './../../../libraries/Security.js'
import password from "./../../../utils/Password.js";
import Boom from "boom";
import axios from "axios";
import path from 'path';
import CommonConstant from '../../../constants/CommonConstant.js';
import { Worker } from 'worker_threads';
import moment from 'moment';
const commonModel = new BaseModel;

/**
 * Registration service by @sachinpal .
 *
 * @param  {object} req
 * @param  {object} res
 * @param  {Object} next Next request.
 */

const signup = async (req, res, next) => { 
    //hashing password
    try {
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
            return response;
        }).catch((err) => {
            throw err;
        })
    } catch (err) {
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

const addTelemetry = (telemetryData) => {

    const full_path = 'caching/telemetryBackend.json';

    // Read the contents of root.json
    fs.readFile(full_path, (err, data) => {
        if (err) {
            return false;
        }

        // Parse telemetryBackend.json data into a JavaScript object
        const rootObject = JSON.parse(data);

        // Push the new object into the array

        for(let index = 0; index < telemetryData.length ; index++)
        {
            rootObject.push(telemetryData[index]);
        }

        // Convert the updated object back to JSON string
        const updatedData = JSON.stringify(rootObject, null, 2);

        // Write the updated JSON data back to the file
        fs.writeFile(full_path, updatedData, (err) => {
            if (err) {
                throw err;
            }
            return true;
        });
    });
}


const login = (async (req, res, next) => {

    let telemetryData = [];
    const appSessionId = req.header('appSessionId');
    const correlationId = Security.getUUID();
    const apiName = 'login';

    try {

        const telemetryRequest = {
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
            type: 'Request',
            appSessionId: appSessionId,       
            correlationId: correlationId,     
            apiName: apiName,
            payload: req.body
        }
        telemetryData.push(telemetryRequest);

        const response = { "data": {} };

        await commonModel.fetchObj({ 'mobileno': req.body.mobile }, 'customer').then(async (data) => {
            if (data.length > 0) {
                // User Found in our DB!
                const match = password.compare(req.body.password, data[0].password);

                if (match) {
                    // create authtoken
                    let authData = {
                        'customerid': data[0].customerid
                    }

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
                // If User not exist in our DB!
                // We need to check userSignupData (Staged Area) !

                const full_path = 'userSignupData.json';
                let isUserFound = false;
                let json = readFile(req, full_path);

                if (json.length > 0) {

                    json = JSON.parse(json);

                    for (let index = 0; index < json.length; index++) {

                        const element = json[index];

                        if (element['mobileno'] == req.body.mobile) {

                            isUserFound = true;

                            const updatedOtp = getOtp()
                            let authData = {
                                'customerid': req.body.mobile
                            }
                            let authToken = Security.getUserAuthToken(authData);

                            element[req.body.mobile] = [updatedOtp];
                            element['device-token'] = req.headers['device-token'];
                            element['authToken'] = authToken;

                            updateOtpOnFile(json, full_path);
                            sendMsg(req, updatedOtp);
                            
                            response.data.isOtpVerified = false;
                            response.data.message = 'OTP sent to the user successfully!';
                            response.data.token = authToken;

                            break;
                        }
                    }
                }

                // User not exist in our Staging Area!, Register Again 
                if(isUserFound == false)
                {
                    const data = { "error_code": "INVALID_USER" };
                    throw Boom.badRequest('No user found', data);
                }
            }

            // If everything works well 
            const telemetryResponse = {
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                type: 'Response',
                appSessionId: appSessionId,               
                correlationId: correlationId,             
                apiName: apiName,
                response : response
            }
            telemetryData.push(telemetryResponse);
            addTelemetry(telemetryData);
            return response;
        })
    } catch (err) {
        const telemetryError = {
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
            type: 'Error',
            appSessionId: appSessionId,               
            correlationId: correlationId,             
            apiName: apiName,
            response : err.output.payload
        }
        telemetryData.push(telemetryError);
        addTelemetry(telemetryData);
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
    return validationForSendOtp(req, 'userSignupData.json').then(() => {
        const response = { "data": {} };
        return response;
    }).catch((err) => {
        throw err
    })

}

const checkFile = async (req, obj, fileName) => {
    var array = [];
    const full_path = `caching/${fileName}`;

    let json = await readFile(req,fileName)
    console.log('json',json)
    if(json.length > 0){
        json = JSON.parse(json);


        //condition for check max otp limit
        let finalValue = await json.filter(val => val.mobileno == req.body.mobile);

        if (finalValue.length > 0) {
            const data = { "error_code": "89" };
            throw Boom.badRequest('user already exist.', data);
        } else {
            json.push(obj);
            updateJsonOnFile(json,full_path)
            return true

        }
    } else {
        array.push(obj);
        updateJsonOnFile(array,full_path)
        return true
    }

}

const validationForSendOtp = async (req, fileName) => {
    const authToken = req.header('authorization').replace('Bearer ', '');
    const deviceToken = req.headers['device-token']

    let json = readFile(req,fileName)
    
    if(json.length > 0){
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

const readFile = async (req,fileName)=>{
    // let json;
    const full_path = `caching/${fileName}`;
    let json = fs.readFileSync(full_path, "utf8")
    return json;

    
}

const updateJsonOnFile = (obj,fileName)=>{
        const WriteWorker =  new Worker(`${import.meta.dirname}/WriteFile.js`,{
        workerData: {fileName:fileName,obj:obj}
    });
   return WriteWorker.on('message',data=>data );

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

              return  await commonModel.createObj(addressObj, 'address').then((addresid) => {
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
    try{
        return commonModel.fetchAll('appConfig').then((data)=>{
            response.data = data;
            return response;
        })
    }catch(err){
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
            
            if(numberExist[0][req.body.mobile].length > 2 && req.headers['device-token']==numberExist[0].deviceToken){
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
    const otp = getOtp();
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

                // console.log('json',json)
            updateJsonOnFile(updateData,full_path)
            return response;
 
        }else{
            const data = { "error_code": "88" };
                throw Boom.badRequest('Number does not exist', data);
        }

    }catch(err){
        throw err;
        
    }
}


const authService = { signup, sendOtp, verifyOtp,login,updateJsonOnFile,appConfig, forgetPassword,passwordOtpVerify};
export default authService;