import Joi from "joi";
import validate from "./../../../utils/Validate.js";
import BaseModel from './../../../models/BaseModel.js'
import Boom from "boom";
import AWS from 'aws-sdk';
import fs from 'fs'
import UserService from "../services/UserService.js";


const commonModel = new BaseModel;


const languageId = function (req, res, next) {
    if (req.body.languageId == undefined || req.body.languageId.length != 1 || isNaN(req.body.languageId)) {
        const data = { "error_code": "400" };
        throw Boom.badRequest('Invalid languageId', data);
    } else {
        next()
    }
};

const authToken = function (req, res, next) {
    if (!req.header('authorization')) {
        const data = { "error_code": "401" };
        throw Boom.badRequest('Invalid authorization Token', data);
    } else {
        next()
    }
};

const appSessionId = function (req, res, next) {
    if (!req.header('appSessionId')) {
        const data = { "error_code": "402" };
        throw Boom.badRequest('Invalid App Session Id', data);
    } else {
        next()
    }
};





const validation = {languageId, authToken, appSessionId};
export default validation