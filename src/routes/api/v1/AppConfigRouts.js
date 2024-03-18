
import Router  from 'express';
import validation from '../../../api/v1/validators/AuthValidator.js'
import config from '../../../api/v1/controllers/AppConfig.js';
const appRoutes = new Router();

appRoutes.get( "/app-config" ,
   // validation.decodeReq,
   validation.checkDeviceAndAuthToken,
   config.appConfig
);

export {appRoutes}