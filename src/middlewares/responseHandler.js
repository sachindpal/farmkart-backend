/**
 * Middleware to sanitizing and triming JSON body requests.
 *
 * @param  {Object}   request
 * @param  {Object}   response
 * @param  {Function} next
 */
export const responseHandler = function( request, response, next ) {
    response.header( "Access-Control-Allow-Origin", process.env.ASSETS_URL_BASE );
    response.header( "Access-Control-Allow-Methods", "GET,PUT,POST,DELETE" );
    response.header( "Access-Control-Allow-Headers", "Content-Type" );
    next();
};

export const sendResponse = function( request, response, HttpStatus, resdata ) {
    console.log('resdata',resdata)
    const responseObj = {
        "status": "success",
        "status_code": HttpStatus,
        // "message": resdata.message,
        "data": resdata.data
    };
    
    return response.status( HttpStatus ).json( responseObj );
};

export const sendWebResponse = function( request, response, HttpStatus, responseObj ) {
    responseObj.status = "success";
    
    return response.status( HttpStatus ).json( responseObj );
};
