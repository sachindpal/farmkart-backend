import Joi from "joi";

/**
 * Utility helper for Joi validation.
 *
 * @param  {object}  data
 * @param  {object}  schema
 * @returns {Promise}
 */
const validate = function( data, schema ) {
    return Joi.validate( data, schema, { "abortEarly": false, "escapeHtml": false }, ( err ) => {
        if ( err ) {
            return Promise.reject( err );
        }

        return Promise.resolve( null );
    } );
};

export default validate;
