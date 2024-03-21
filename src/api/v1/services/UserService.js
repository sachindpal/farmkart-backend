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


const userInfo = (async (req, res, next) => {

    const appSessionId = req.header('appSessionId');
    const apiName = 'userInfo';

    const telemetryObj = new Telemetry(appSessionId, apiName);

    try {

        telemetryObj.addRequest(req.body);

        const response = { "data": {} };

        await commonModel.fetchSingleWithJoin(['stateid', 'districtid', 'tehsilid', 'villageid'], { 'customer.customerid': 20060000 }, 'customerid', 'address', 'customerid', 'customer').then(async (data) => {

            response.data = data;
        })

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



const service = { userInfo };
export default service;