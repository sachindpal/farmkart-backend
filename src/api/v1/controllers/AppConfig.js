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
const appConfig = function( req, res, next ) {
    return authService
        .appConfig( req, next )
        .then( ( data ) => sendResponse( req, res, HttpStatus.OK, data ) )
        .catch( ( err ) => next( err ) );  
}; 

const config = {
    appConfig
}
export default config
