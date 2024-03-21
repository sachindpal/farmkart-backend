
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';


export default class Security {


    /**
     * Get user auth token.
     *
     * @param  {Array} user
     * @returns {string}
     */
    static getUserAuthToken(user) {
        console.log('process.env.JWT_SECRET', process.env.JWT_SECRET)
        const token = jwt.sign(JSON.parse(JSON.stringify(user)), process.env.JWT_SECRET, {
            "expiresIn": '1d'
        });

        return token;
    }

    static getUUID() {
        // Generate a UUID v4 (random)
        const generatedUUID = uuidv4();

        // Take first 24 characters of the UUID
        const truncatedUUID = generatedUUID.substring(0, 24);

        return truncatedUUID;
    }

    /**
     * verify user auth token.
     *
     * @param  {Array} user
     * @returns {string}
     */
    static verifyToken(token) {
        
        try{
            var decoded = jwt.verify(token, process.env.JWT_SECRET);
             return decoded;

        }catch(err){
            console.log('err',err)
            throw err
        }
        
    }

    /**
     * Check User authentication..
     *
     * @param  {Object} req Request.
     * @param  {Object} res Response.
     * @param  {Object} next Next request.
     * @returns {string}
     */
    static checkUserAuth(req, res, next) {

        return userService.checkUserAuth(req)
            .then(() => next())
            .catch((err) => next(err));
    }
}
