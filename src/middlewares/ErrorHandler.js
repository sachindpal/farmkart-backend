import logger from "../utils/Logger.js";
import HttpStatus from "http-status-codes";
import buildError from "../utils/BuildError.js";

/**
 * Error response middleware for 404 not found.
 *
 * @param {Object} req
 * @param {Object} res
 */
export const notFound = function( req, res ) {

    const error = {
        "status": "error",
        "status_code": HttpStatus.NOT_FOUND,
        "error_type": "NOT_FOUND",
        "message": HttpStatus.getStatusText( HttpStatus.NOT_FOUND ),
        "data": {}
    };
    const deviceType = parseInt( req.headers[ "device-type" ] );


    res.status( HttpStatus.NOT_FOUND ).json( error );
};

/**
 * Method not allowed error middleware. This middleware should be placed at
 * the very bottom of the middleware stack.
 *
 * @param {Object} req
 * @param {Object} res
 */
export const methodNotAllowed = function( req, res ) {
    const error = {
        "status": "error",
        "status_code": HttpStatus.METHOD_NOT_ALLOWED,
        "error_type": "METHOD_NOT_ALLOWED",
        "message": HttpStatus.getStatusText( HttpStatus.METHOD_NOT_ALLOWED ),
        "data": {}
    };
    // const deviceType = parseInt( req.headers[ "device-type" ] );

    res.status( HttpStatus.METHOD_NOT_ALLOWED ).json( error );
};

/**
 * To handle errors from body parser for cases such as invalid JSON sent through
 * the body.
 *
 * Https://github.com/expressjs/body-parser#errors.
 *
 * @param  {Object}   err
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
export const bodyParser = function( err, req, res, next ) {
    logger.error( err.message );
    const deviceType = parseInt( req.headers[ "device-type" ] );
    
    res.status( err.status ).json( {
        "error": {
            "code": err.status,
            "message": HttpStatus.getStatusText( err.status )
        }
    } );
};

/**
 * Generic error response middleware for validation and internal server errors.
 *
 * @param  {Object}   err
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
export const genericErrorHandler = function( err, req, res, next ) {
    logger.error( err.stack );
    const error = buildError( err );
    
    res.status( error.status_code ).json( error );
};
