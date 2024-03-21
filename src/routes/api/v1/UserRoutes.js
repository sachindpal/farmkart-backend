
import Router from 'express';
import Controller from '../../../api/v1/controllers/UserController.js';
import Validation from '../../../api/v1/validators/UserValidator.js'

const UserRoutes = new Router();

UserRoutes.post("/userInfo",
    Validation.authToken,       // for headers 
    Validation.appSessionId,    // for headers 
    Validation.languageId,
    Controller.userInfo
);

export { UserRoutes }