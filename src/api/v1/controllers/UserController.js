import HttpStatus from "http-status-codes";
import UserService from "../services/UserService.js";
import { sendResponse } from "../../../middlewares/responseHandler.js";


const userInfo = function( req, res, next ) {
    return UserService
        .userInfo( req, next )
        .then( ( data ) => sendResponse( req, res, HttpStatus.OK, data ) )
        .catch( ( err ) => next( err ) );  
}; 


const controller = {userInfo}
export default controller