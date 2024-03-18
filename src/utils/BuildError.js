import HttpStatus from "http-status-codes";
// import Boom from "boom";

/**
 * Build error response for validation errors.
 *
 * @param  {Error} err
 * @returns {Object}
 */
const buildError = function( err ) {
    
    // Validation errors
    if ( err.isJoi ) {
        return {
            "status": "error",
            "status_code": HttpStatus.BAD_REQUEST,
            "error_type": "INVALID_PARAM_VALUE",
            "message": "Seems you have entered information incorrect. Please verify once and continue",
            "error_details":
                err.details && err.details.map( ( error ) => {
                    return {
                        "message": error.message.replace( /"/g, "" ),
                        "param": error.path.join( "." )
                    };
                } ),
            "data": {}
        };
    }

    // HTTP errors
    if ( err.isBoom ) {
        // if error data
        if( err.data !== null ) {
            return {
                "status": "error",
                "status_code": err.output.statusCode,
                "error_type": err.data.error_code,
                "message": err.output.payload.message || err.output.payload.error,
                "data": {}
            };
        }

        return {
            "status": "error",
            "status_code": err.output.statusCode,
            "message": err.output.payload.message || err.output.payload.error,
            "data": {}
        };
    }

    // Return INTERNAL_SERVER_ERROR for all other cases
    return {
        "status": "error",
        "status_code": HttpStatus.INTERNAL_SERVER_ERROR,
        "error_type": "INTERNAL_SERVER_ERROR",
        "message": HttpStatus.getStatusText( HttpStatus.INTERNAL_SERVER_ERROR ),
        "data": {}
    };
};

export default buildError;
